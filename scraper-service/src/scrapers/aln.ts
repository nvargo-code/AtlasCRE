import { Browser, BrowserContext, Page } from "playwright";
import { NormalizedListing } from "../types";

const ALN_BASE = "https://www.austinluxurynetwork.com";
const ALN_LOGIN = `${ALN_BASE}/login`;
const SESSION_FILE = "/tmp/aln-session.json";
const TWO_FA_CODE_FILE = "/tmp/aln-2fa-code.txt";
export const TWO_FA_PENDING_FILE = "/tmp/aln-2fa-pending";

// ── Session helpers ───────────────────────────────────────────────────────────

async function saveSession(context: BrowserContext): Promise<void> {
  try {
    const fs = await import("fs");
    const cookies = await context.cookies();
    fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies));
    console.log("[aln] Session cookies saved");
  } catch (err) {
    console.warn("[aln] Could not save session:", err);
  }
}

async function tryLoadSession(context: BrowserContext): Promise<boolean> {
  try {
    const fs = await import("fs");
    if (!fs.existsSync(SESSION_FILE)) return false;
    const raw = fs.readFileSync(SESSION_FILE, "utf8");
    const cookies = JSON.parse(raw);
    await context.addCookies(cookies);
    console.log("[aln] Loaded saved session cookies");
    return true;
  } catch {
    return false;
  }
}

async function isSessionValid(page: Page): Promise<boolean> {
  try {
    await page.goto(`${ALN_BASE}/listings`, { waitUntil: "domcontentloaded", timeout: 15000 });
    const url = page.url();
    const valid = !url.includes("/login") && !url.includes("/sign_in");
    console.log(`[aln] Session valid: ${valid} (url: ${url})`);
    return valid;
  } catch {
    return false;
  }
}

// ── 2FA helpers ───────────────────────────────────────────────────────────────

function setPending(fs: typeof import("fs"), pending: boolean): void {
  try {
    if (pending) {
      fs.writeFileSync(TWO_FA_PENDING_FILE, "1");
    } else {
      try { fs.unlinkSync(TWO_FA_PENDING_FILE); } catch {}
    }
  } catch {}
}

// ── Login ─────────────────────────────────────────────────────────────────────

async function login(page: Page): Promise<void> {
  const fs = await import("fs");
  const username = process.env.ALN_USERNAME;
  const password = process.env.ALN_PASSWORD;

  if (!username || !password) {
    throw new Error("ALN_USERNAME and ALN_PASSWORD env vars are required");
  }

  await page.goto(ALN_LOGIN, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log("[aln] Login page URL:", page.url());

  const usernameInput = await page.waitForSelector(
    "input[type='text'], input[name='username'], input[name='user'], input[name='login'], input[placeholder*='user' i], input[placeholder*='name' i], input[type='email']",
    { timeout: 10000 }
  );
  await usernameInput.fill(username);

  const passwordInput = await page.waitForSelector(
    "input[type='password'], input[name='password'], input[id='password']",
    { timeout: 5000 }
  );
  await passwordInput.fill(password);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {}),
    page.click("button[type='submit'], input[type='submit'], .login-button, [value='Login']"),
  ]);

  console.log("[aln] Post-login URL:", page.url());

  if (page.url().includes("two_factor") || page.url().includes("2fa") || page.url().includes("verify")) {
    console.log("[aln] 2FA required — waiting for code via HTTP or file...");

    // Clear any stale code and signal that we're waiting
    try { fs.unlinkSync(TWO_FA_CODE_FILE); } catch {}
    setPending(fs, true);

    let code = "";
    for (let i = 0; i < 120; i++) {
      try {
        code = fs.readFileSync(TWO_FA_CODE_FILE, "utf8").trim();
        if (code) break;
      } catch {}
      await page.waitForTimeout(1000);
    }

    setPending(fs, false);
    if (!code) throw new Error("2FA code not provided within 120 seconds");

    console.log("[aln] Got 2FA code, submitting...");
    const codeInput = await page.waitForSelector(
      "input[type='text']:not([name='authenticity_token']), input[type='number'], input[name*='code']:not([name='authenticity_token']), input[name*='otp']",
      { timeout: 5000 }
    );
    await codeInput.fill(code);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {}),
      page.click("button[type='submit'], input[type='submit']"),
    ]);
    try { fs.unlinkSync(TWO_FA_CODE_FILE); } catch {}
    console.log("[aln] 2FA complete, URL:", page.url());
  }
}

// ── Geocoding ─────────────────────────────────────────────────────────────────

async function geocodeAddress(address: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${address}, ${city}, ${state}`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "User-Agent": "AtlasCRE/1.0 (internal)" }, signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// ── Page scraper ──────────────────────────────────────────────────────────────

async function scrapeListingsPage(page: Page): Promise<NormalizedListing[]> {
  const listings: NormalizedListing[] = [];
  await page.waitForTimeout(3000);
  const url = page.url();
  console.log("[aln] Scraping page:", url);

  const cardSelector = [
    ".listing-card", ".property-card", ".listing-item", ".property-item",
    "[class*='listing']", "[class*='property']", "article",
  ].join(", ");

  const cards = await page.$$(cardSelector);
  console.log(`[aln] Found ${cards.length} potential listing elements`);

  for (const card of cards) {
    try {
      const getText = async (sel: string) =>
        (await card.$eval(sel, (el) => el.textContent?.trim() ?? "").catch(() => ""));
      const getAttr = async (sel: string, attr: string) =>
        (await card.$eval(sel, (el, a) => el.getAttribute(a) ?? "", attr).catch(() => ""));

      const addressText = await getText(".address, [class*='address'], [data-field='address']")
        || await getText("h2, h3, h4");
      if (!addressText) continue;

      const priceText = await getText(".price, [class*='price'], [data-field='price']");
      const sqftText = await getText(".sqft, [class*='sqft'], [class*='size'], [data-field='sqft']");
      const typeText = await getText(".type, [class*='type'], [class*='property-type']");
      const brokerText = await getText(".broker, [class*='broker'], [class*='agent']");
      const img = await getAttr("img", "src");
      const link = await getAttr("a", "href");

      const parts = addressText.split(",").map((s: string) => s.trim());
      const address = parts[0] ?? addressText;
      const city = parts[1] ?? "Austin";

      let priceAmount: number | undefined;
      if (priceText) {
        const cleaned = priceText.replace(/[^0-9.]/g, "");
        const val = parseFloat(cleaned);
        if (!isNaN(val)) {
          priceAmount = priceText.includes("M") ? val * 1_000_000
            : priceText.includes("K") ? val * 1_000
            : val;
        }
      }

      let buildingSf: number | undefined;
      if (sqftText) {
        const match = sqftText.match(/([\d,]+)/);
        if (match) buildingSf = parseInt(match[1].replace(/,/g, ""));
      }

      const geo = await geocodeAddress(address, city, "TX");
      if (!geo) continue;
      await new Promise((r) => setTimeout(r, 250));

      const sourceUrl = link?.startsWith("http") ? link : link ? `${ALN_BASE}${link}` : undefined;
      const id = sourceUrl ? sourceUrl.split("/").filter(Boolean).pop() ?? address : address;

      listings.push({
        externalId: id.replace(/\s+/g, "-").toLowerCase(),
        sourceSlug: "aln",
        address,
        city,
        state: "TX",
        lat: geo.lat,
        lng: geo.lng,
        market: "austin",
        propertyType: typeText || "Residential",
        listingType: "sale",
        buildingSf,
        priceAmount,
        priceUnit: "total",
        brokerName: brokerText || undefined,
        imageUrl: img || undefined,
        sourceUrl,
        rawData: { addressText, priceText, sqftText, typeText, brokerText },
      });
    } catch (err) {
      console.warn("[aln] Error parsing card:", err);
    }
  }

  return listings;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function scrapeALN(browser: Browser): Promise<NormalizedListing[]> {
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();
  const listings: NormalizedListing[] = [];

  try {
    // Try to reuse a saved session first
    const sessionLoaded = await tryLoadSession(context);
    let needsLogin = true;

    if (sessionLoaded) {
      needsLogin = !(await isSessionValid(page));
      if (!needsLogin) {
        console.log("[aln] Reusing saved session — no login needed");
      } else {
        console.log("[aln] Saved session expired — logging in");
      }
    }

    if (needsLogin) {
      await login(page);
      await saveSession(context); // persist for next run
    }

    // Navigate to listings
    const listingsPaths = ["/listings", "/properties", "/search", "/members/listings", "/dashboard"];
    let navigated = false;
    for (const path of listingsPaths) {
      await page.goto(`${ALN_BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      if (!page.url().includes("/login")) {
        navigated = true;
        console.log(`[aln] Found listings at: ${page.url()}`);
        break;
      }
    }

    if (!navigated) {
      console.warn("[aln] Could not find listings page");
    }

    const pageListings = await scrapeListingsPage(page);
    listings.push(...pageListings);

    let pageNum = 2;
    while (pageNum <= 10) {
      const nextBtn = await page.$("[aria-label='Next'], .next, [rel='next'], a[href*='page=" + pageNum + "']");
      if (!nextBtn) break;

      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {}),
        nextBtn.click(),
      ]);
      await page.waitForTimeout(2000);

      const more = await scrapeListingsPage(page);
      if (more.length === 0) break;
      listings.push(...more);
      pageNum++;
    }
  } finally {
    try { await context.close(); } catch {}
  }

  console.log(`[aln] Total listings scraped: ${listings.length}`);
  return listings;
}
