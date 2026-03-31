import { Browser, BrowserContext, Page } from "playwright";
import { NormalizedListing } from "../types";

const ALN_BASE = "https://www.austinluxurynetwork.com";
const ALN_LOGIN = `${ALN_BASE}/login`;
const SESSION_FILE = "/tmp/aln-session.json";
const TWO_FA_CODE_FILE = "/tmp/aln-2fa-code.txt";
export const TWO_FA_PENDING_FILE = "/tmp/aln-2fa-pending";
const PARTIAL_RESULTS_FILE = "/tmp/aln-listings.json";

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

// ── Geocoding cache ───────────────────────────────────────────────────────────

const GEOCACHE_FILE = "/opt/atlas-scraper/geocache.json";
let geocache: Record<string, { lat: number; lng: number }> = {};

function loadGeocache(): void {
  try {
    const fs = require("fs");
    if (fs.existsSync(GEOCACHE_FILE)) {
      geocache = JSON.parse(fs.readFileSync(GEOCACHE_FILE, "utf8"));
      console.log(`[aln] Loaded geocache: ${Object.keys(geocache).length} entries`);
    }
  } catch {}
}

function saveGeocache(): void {
  try {
    const fs = require("fs");
    fs.writeFileSync(GEOCACHE_FILE, JSON.stringify(geocache));
  } catch {}
}

// ── Geocoding ─────────────────────────────────────────────────────────────────

async function geocodeAddress(address: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  const key = `${address}|${city}|${state}`.toLowerCase();
  if (geocache[key]) return geocache[key];

  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    console.warn("[aln] MAPBOX_TOKEN not set — skipping geocode");
    return null;
  }

  try {
    const q = encodeURIComponent(`${address}, ${city}, ${state}`);
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&limit=1&country=US`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json() as { features: Array<{ center: [number, number] }> };
    if (!data.features?.length) return null;
    const [lng, lat] = data.features[0].center;
    const result = { lat, lng };
    geocache[key] = result;
    saveGeocache();
    return result;
  } catch {
    return null;
  }
}

// ── Page scraper ──────────────────────────────────────────────────────────────

interface RawCard {
  addressText: string;
  priceText: string;
  sqftText: string;
  typeText: string;
  brokerText: string;
  img: string;
  link: string;
  fullText: string;
}

async function scrapeListingsPage(page: Page): Promise<NormalizedListing[]> {
  await page.waitForTimeout(1500);
  const url = page.url();
  console.log("[aln] Scraping page:", url);

  // Batch extract all card data in one browser call
  // Use :not() to avoid matching nested elements inside cards
  const rawCards: RawCard[] = await page.$$eval(
    "article, .listing-card, .property-card, .listing-item, .property-item",
    (els) => els.map((el) => {
      const t = (sel: string) => el.querySelector(sel)?.textContent?.trim() ?? "";
      const a = (sel: string, attr: string) => (el.querySelector(sel) as HTMLElement | null)?.getAttribute(attr) ?? "";
      // Full text of the element for address fallback
      const fullText = el.textContent?.trim() ?? "";
      return {
        addressText: t(".address, [class*='address'], [data-field='address']") || t("h2, h3, h4") || fullText.split("\n")[0],
        priceText:   t(".price, [class*='price'], [data-field='price']"),
        sqftText:    t(".sqft, [class*='sqft'], [class*='size'], [data-field='sqft']"),
        typeText:    t(".type, [class*='type'], [class*='property-type']"),
        brokerText:  t(".broker, [class*='broker'], [class*='agent']"),
        img:         a("img", "src"),
        link:        a("a", "href"),
        fullText,
      };
    })
  ).catch(() => [] as RawCard[]);

  console.log(`[aln] Found ${rawCards.length} potential listing elements`);

  // Parse card data (sync, no I/O)
  // ALN address format: "10221 David Moore\n\nAustin , TX 78748"
  const seen = new Set<string>();
  const parsed = rawCards
    .filter((c) => !!c.addressText)
    .map((c) => {
      // Split on newlines first, then fall back to comma splitting
      const lines = c.addressText.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      const address = lines[0] ?? c.addressText;
      const cityLine = lines[1] ?? "";
      const cityMatch = cityLine.match(/^([^,]+)/);
      const city = cityMatch?.[1]?.trim().replace(/\s+/g, " ") || "Austin";

      let priceAmount: number | undefined;
      if (c.priceText) {
        const val = parseFloat(c.priceText.replace(/[^0-9.]/g, ""));
        if (!isNaN(val)) {
          priceAmount = c.priceText.includes("M") ? val * 1_000_000
            : c.priceText.includes("K") ? val * 1_000
            : val;
        }
      }

      let buildingSf: number | undefined;
      const sfMatch = c.sqftText.match(/([\d,]+)/);
      if (sfMatch) buildingSf = parseInt(sfMatch[1].replace(/,/g, ""));

      const sourceUrl = c.link?.startsWith("http") ? c.link : c.link ? `${ALN_BASE}${c.link}` : undefined;
      const id = sourceUrl ? sourceUrl.split("/").filter(Boolean).pop() ?? address : address;

      return { address, city, priceAmount, buildingSf, sourceUrl, id, c };
    })
    .filter((p) => {
      // Deduplicate by address
      if (seen.has(p.address.toLowerCase())) return false;
      seen.add(p.address.toLowerCase());
      return true;
    });

  console.log(`[aln] ${parsed.length} unique listings after dedup`);

  // Geocode sequentially — Nominatim allows 1 req/s; cache means most are instant
  const listings: NormalizedListing[] = [];
  for (const p of parsed) {
    const geo = await geocodeAddress(p.address, p.city, "TX");
    if (!geo) continue;
    listings.push({
      externalId: p.id.replace(/\s+/g, "-").toLowerCase(),
      sourceSlug: "aln",
      address: p.address,
      city: p.city,
      state: "TX",
      lat: geo.lat,
      lng: geo.lng,
      market: "austin",
      propertyType: p.c.typeText || "Residential",
      listingType: "sale",
      buildingSf: p.buildingSf,
      priceAmount: p.priceAmount,
      priceUnit: "total",
      brokerName: p.c.brokerText || undefined,
      imageUrl: p.c.img || undefined,
      sourceUrl: p.sourceUrl,
      rawData: { addressText: p.c.addressText, priceText: p.c.priceText, sqftText: p.c.sqftText, typeText: p.c.typeText, brokerText: p.c.brokerText },
    });
  }

  return listings;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function scrapeALN(browser: Browser): Promise<NormalizedListing[]> {
  loadGeocache();
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

    const fs = await import("fs");
    const savePartial = () => {
      try { fs.writeFileSync(PARTIAL_RESULTS_FILE, JSON.stringify(listings)); } catch {}
    };

    const pageListings = await scrapeListingsPage(page);
    listings.push(...pageListings);
    savePartial();

    let pageNum = 2;
    while (pageNum <= 10) {
      const nextBtn = await page.$("[aria-label='Next'], .next, [rel='next'], a[href*='page=" + pageNum + "']");
      if (!nextBtn) break;

      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {}),
        nextBtn.click(),
      ]);
      await page.waitForTimeout(1000);

      const more = await scrapeListingsPage(page);
      if (more.length === 0) break;
      listings.push(...more);
      savePartial();
      pageNum++;
    }
  } finally {
    try { await context.close(); } catch {}
  }

  console.log(`[aln] Total listings scraped: ${listings.length}`);
  return listings;
}
