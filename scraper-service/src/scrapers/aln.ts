import { Browser, Page } from "playwright";
import { NormalizedListing } from "../types";

const ALN_BASE = "https://www.austinluxurynetwork.com";
const ALN_LOGIN = `${ALN_BASE}/login`;

async function login(page: Page): Promise<void> {
  const email = process.env.ALN_USERNAME;
  const password = process.env.ALN_PASSWORD;

  if (!email || !password) {
    throw new Error("ALN_USERNAME and ALN_PASSWORD env vars are required");
  }

  await page.goto(ALN_LOGIN, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(1500);

  // Fill credentials
  const emailInput = await page.waitForSelector(
    "input[type='email'], input[name='email'], input[id='email'], input[placeholder*='email' i]",
    { timeout: 10_000 }
  );
  await emailInput.fill(email);

  const passwordInput = await page.waitForSelector(
    "input[type='password'], input[name='password'], input[id='password']",
    { timeout: 5_000 }
  );
  await passwordInput.fill(password);

  // Submit
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30_000 }),
    page.click("button[type='submit'], input[type='submit'], .login-button, [value='Login']"),
  ]);

  console.log("[aln] Login complete");
}

async function geocodeAddress(address: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${address}, ${city}, ${state}`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "User-Agent": "AtlasCRE/1.0 (internal)" } }
    );
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

async function scrapeListingsPage(page: Page): Promise<NormalizedListing[]> {
  const listings: NormalizedListing[] = [];

  // Wait for some listing content to load
  await page.waitForTimeout(3000);

  // Capture the current URL and page content to understand the structure
  const url = page.url();
  console.log("[aln] Scraping page:", url);

  // Try common listing card selectors — adjust these once you've inspected the
  // actual post-login HTML structure at austinluxurynetwork.com/listings
  const cardSelector = [
    ".listing-card",
    ".property-card",
    ".listing-item",
    ".property-item",
    "[class*='listing']",
    "[class*='property']",
    "article",
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

      // Parse address — ALN is Austin-only so default city to Austin
      const parts = addressText.split(",").map((s: string) => s.trim());
      const address = parts[0] ?? addressText;
      const city = parts[1] ?? "Austin";

      // Parse price
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

      // Parse sqft
      let buildingSf: number | undefined;
      if (sqftText) {
        const match = sqftText.match(/([\d,]+)/);
        if (match) buildingSf = parseInt(match[1].replace(/,/g, ""));
      }

      // Geocode
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

export async function scrapeALN(browser: Browser): Promise<NormalizedListing[]> {
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();
  const listings: NormalizedListing[] = [];

  try {
    await login(page);

    // Navigate to listings — try common paths after login
    // If none of these are right, check the actual URL after manual login
    const listingsPaths = ["/listings", "/properties", "/search", "/members/listings", "/dashboard"];
    let navigated = false;

    for (const path of listingsPaths) {
      await page.goto(`${ALN_BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 15_000 });
      if (!page.url().includes("/login")) {
        navigated = true;
        console.log(`[aln] Found listings at: ${page.url()}`);
        break;
      }
    }

    if (!navigated) {
      console.warn("[aln] Could not find listings page — check ALN_LISTINGS_PATH env var");
      // Fall back to whatever page landed on after login
    }

    // Scrape current page
    const pageListings = await scrapeListingsPage(page);
    listings.push(...pageListings);

    // Try paginating
    let pageNum = 2;
    while (pageNum <= 10) {
      const nextBtn = await page.$("[aria-label='Next'], .next, [rel='next'], a[href*='page=" + pageNum + "']");
      if (!nextBtn) break;

      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15_000 }).catch(() => {}),
        nextBtn.click(),
      ]);
      await page.waitForTimeout(2000);

      const more = await scrapeListingsPage(page);
      if (more.length === 0) break;
      listings.push(...more);
      pageNum++;
    }
  } finally {
    await context.close();
  }

  console.log(`[aln] Total listings scraped: ${listings.length}`);
  return listings;
}
