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

// ── Listing card scraper ──────────────────────────────────────────────────────

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

interface ParsedCard {
  address: string;
  city: string;
  zip: string | undefined;
  priceAmount: number | undefined;
  buildingSf: number | undefined;
  sourceUrl: string | undefined;
  id: string;
  c: RawCard;
}

async function scrapeListingsPage(page: Page): Promise<ParsedCard[]> {
  await page.waitForTimeout(1500);
  const url = page.url();
  console.log("[aln] Scraping page:", url);

  const rawCards: RawCard[] = await page.$$eval(
    "article, .listing-card, .property-card, .listing-item, .property-item",
    (els) => els.map((el) => {
      const t = (sel: string) => el.querySelector(sel)?.textContent?.trim() ?? "";
      const a = (sel: string, attr: string) => (el.querySelector(sel) as HTMLElement | null)?.getAttribute(attr) ?? "";
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

  const seen = new Set<string>();
  const parsed = rawCards
    .filter((c) => !!c.addressText)
    .map((c) => {
      const lines = c.addressText.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      const address = lines[0] ?? c.addressText;
      const cityLine = lines[1] ?? "";
      const cityMatch = cityLine.match(/^([^,]+)/);
      const city = cityMatch?.[1]?.trim().replace(/\s+/g, " ") || "Austin";

      // Extract ZIP from city line (e.g., "Austin, TX 78748")
      const zipMatch = cityLine.match(/\b(\d{5})\b/);
      const zip = zipMatch?.[1];

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

      return { address, city, zip, priceAmount, buildingSf, sourceUrl, id, c };
    })
    .filter((p) => {
      if (seen.has(p.address.toLowerCase())) return false;
      seen.add(p.address.toLowerCase());
      return true;
    });

  console.log(`[aln] ${parsed.length} unique listings after dedup`);
  return parsed;
}

// ── Detail page scraper ───────────────────────────────────────────────────────

interface DetailData {
  beds?: number;
  baths?: number;
  sqft?: number;
  lotSize?: number;
  yearBuilt?: number;
  stories?: number;
  garageSpaces?: number;
  description?: string;
  propertyType?: string;
  brokerName?: string;
  brokerCompany?: string;
  brokerPhone?: string;
  brokerEmail?: string;
  photos?: string[];
}

async function scrapeDetailPage(page: Page, url: string): Promise<DetailData> {
  const detail: DetailData = {};
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);

    // Extract all text content from the page for parsing
    const pageText = await page.evaluate(() => document.body?.innerText ?? "");

    // Extract structured detail fields — try specific selectors first, fall back to text parsing
    const extractFromPage = await page.evaluate(() => {
      const t = (sel: string) => document.querySelector(sel)?.textContent?.trim() ?? "";
      const all = (sel: string) => Array.from(document.querySelectorAll(sel)).map(el => el.textContent?.trim() ?? "");

      // Try to find a details/specs section
      const detailText = t(".details, .specs, .property-details, .listing-details, [class*='detail'], [class*='spec']");
      const allText = document.body?.innerText ?? "";

      // Collect all images on the page (for photo gallery)
      const images = Array.from(document.querySelectorAll("img"))
        .map(img => img.src)
        .filter(src => src && !src.includes("avatar") && !src.includes("logo") && !src.includes("icon") && (src.includes("images") || src.includes("photo") || src.includes("listing") || src.includes("property") || src.includes("production")));

      // Try to find description
      const desc = t(".description, [class*='description'], .remarks, [class*='remark'], .listing-description, .property-description");

      // Try to find agent/broker info
      const agentSection = t(".agent, .broker, .contact, [class*='agent'], [class*='broker'], [class*='contact'], .listed-by");

      // Get all label-value pairs (many listing sites use dt/dd or label/value patterns)
      const pairs: Record<string, string> = {};
      document.querySelectorAll("dt, th, .label, [class*='label']").forEach(el => {
        const label = el.textContent?.trim().toLowerCase() ?? "";
        const value = (el.nextElementSibling as HTMLElement)?.textContent?.trim() ?? "";
        if (label && value) pairs[label] = value;
      });

      return { detailText, allText, images, desc, agentSection, pairs };
    });

    const text = extractFromPage.allText;

    // Parse beds from text patterns
    const bedsMatch = text.match(/(\d+)\s*(?:bed(?:room)?s?|br|bd)\b/i);
    if (bedsMatch) detail.beds = parseInt(bedsMatch[1]);

    // Parse baths
    const bathsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?|ba)\b/i);
    if (bathsMatch) detail.baths = parseFloat(bathsMatch[1]);

    // Parse sqft
    const sqftMatch = text.match(/([\d,]+)\s*(?:sq\.?\s*ft|sqft|square\s*feet|sf)\b/i);
    if (sqftMatch) detail.sqft = parseInt(sqftMatch[1].replace(/,/g, ""));

    // Parse lot size (acres)
    const lotMatch = text.match(/([\d,.]+)\s*(?:acres?|ac)\b/i);
    if (lotMatch) detail.lotSize = parseFloat(lotMatch[1].replace(/,/g, ""));

    // Parse year built
    const ybMatch = text.match(/(?:year\s*built|built\s*(?:in)?|constructed)\s*:?\s*(\d{4})/i);
    if (ybMatch) detail.yearBuilt = parseInt(ybMatch[1]);

    // Parse stories
    const storiesMatch = text.match(/(\d+)\s*(?:stor(?:y|ies)|level|floor)\b/i);
    if (storiesMatch) detail.stories = parseInt(storiesMatch[1]);

    // Parse garage
    const garageMatch = text.match(/(\d+)\s*(?:car\s*)?garage/i);
    if (garageMatch) detail.garageSpaces = parseInt(garageMatch[1]);

    // Description
    if (extractFromPage.desc && extractFromPage.desc.length > 20) {
      detail.description = extractFromPage.desc.substring(0, 2000);
    }

    // Property type from text
    const typePatterns = [
      { pattern: /single\s*family/i, type: "Single Family" },
      { pattern: /condo/i, type: "Condo" },
      { pattern: /townho(?:me|use)/i, type: "Townhouse" },
      { pattern: /multi[\s-]*family|duplex|triplex|fourplex/i, type: "Multi-Family" },
      { pattern: /mobile|manufactured/i, type: "Mobile/Manufactured" },
      { pattern: /farm|ranch/i, type: "Farm/Ranch" },
      { pattern: /(?:vacant\s*)?land|lot|acreage/i, type: "Land" },
    ];
    for (const { pattern, type } of typePatterns) {
      if (pattern.test(text)) { detail.propertyType = type; break; }
    }

    // Broker info from text
    const phoneMatch = text.match(/(?:phone|cell|tel|mobile|call)[:\s]*(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/i)
      || text.match(/(\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})/);
    if (phoneMatch) detail.brokerPhone = phoneMatch[1];

    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) detail.brokerEmail = emailMatch[1];

    // Also check key-value pairs from the page
    const pairs = extractFromPage.pairs;
    if (pairs["bedrooms"] || pairs["beds"]) detail.beds = detail.beds || parseInt(pairs["bedrooms"] || pairs["beds"]);
    if (pairs["bathrooms"] || pairs["baths"]) detail.baths = detail.baths || parseFloat(pairs["bathrooms"] || pairs["baths"]);
    if (pairs["year built"]) detail.yearBuilt = detail.yearBuilt || parseInt(pairs["year built"]);
    if (pairs["lot size"]) {
      const ls = parseFloat(pairs["lot size"].replace(/,/g, ""));
      if (!isNaN(ls)) detail.lotSize = detail.lotSize || ls;
    }

    // Photos
    if (extractFromPage.images.length > 0) {
      detail.photos = [...new Set(extractFromPage.images)].slice(0, 20);
    }

    console.log(`[aln] Detail: ${url} → beds=${detail.beds} baths=${detail.baths} sqft=${detail.sqft} yr=${detail.yearBuilt} lot=${detail.lotSize} desc=${detail.description?.length ?? 0}ch photos=${detail.photos?.length ?? 0}`);
  } catch (err) {
    console.warn(`[aln] Detail page failed for ${url}:`, err instanceof Error ? err.message : err);
  }
  return detail;
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

    // Phase 1: Collect all listing cards from all pages
    const allCards: ParsedCard[] = [];

    const pageCards = await scrapeListingsPage(page);
    allCards.push(...pageCards);

    let pageNum = 2;
    while (pageNum <= 50) {
      const pageUrl = `${ALN_BASE}/listings?page=${pageNum}`;
      try {
        await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
      } catch {
        console.log(`[aln] Page ${pageNum} load timed out — stopping`);
        break;
      }

      if (!page.url().includes(`page=${pageNum}`)) {
        console.log(`[aln] No more pages after page ${pageNum - 1}`);
        break;
      }

      const more = await scrapeListingsPage(page);
      if (more.length === 0) {
        console.log(`[aln] Page ${pageNum} returned 0 listings — stopping`);
        break;
      }
      allCards.push(...more);
      pageNum++;
    }

    console.log(`[aln] Phase 1 complete: ${allCards.length} listing cards collected`);

    // Phase 2: Visit each detail page and build full listings
    for (let i = 0; i < allCards.length; i++) {
      const p = allCards[i];

      const geo = await geocodeAddress(p.address, p.city, "TX");
      if (!geo) continue;

      // Scrape detail page if we have a URL
      let detail: DetailData = {};
      if (p.sourceUrl) {
        detail = await scrapeDetailPage(page, p.sourceUrl);
        // Rate limit to avoid overwhelming the site
        if (i % 10 === 9) await page.waitForTimeout(1000);
      }

      // Use detail sqft if card didn't have it
      const buildingSf = p.buildingSf || detail.sqft;

      // Detect lease vs sale
      const fullText = (p.c.fullText + " " + p.c.priceText + " " + p.c.typeText + " " + (detail.description || "")).toLowerCase();
      const hasLeaseKeyword = /lease|rent|\/mo|per\s*month|monthly/i.test(fullText);
      const isLikelyLease = hasLeaseKeyword || (p.priceAmount != null && p.priceAmount > 0 && p.priceAmount < 50000);
      const listingType = isLikelyLease ? "lease" : "sale";
      const priceUnit = isLikelyLease ? "per_month" : "total";

      listings.push({
        externalId: p.id.replace(/\s+/g, "-").toLowerCase(),
        sourceSlug: "aln",
        address: p.address,
        city: p.city,
        state: "TX",
        zip: p.zip,
        lat: geo.lat,
        lng: geo.lng,
        market: "austin",
        propertyType: detail.propertyType || p.c.typeText || "Residential",
        listingType,
        buildingSf,
        lotSizeAcres: detail.lotSize,
        priceAmount: p.priceAmount,
        priceUnit,
        yearBuilt: detail.yearBuilt,
        brokerName: detail.brokerName || p.c.brokerText || undefined,
        brokerCompany: detail.brokerCompany,
        brokerPhone: detail.brokerPhone,
        brokerEmail: detail.brokerEmail,
        description: detail.description,
        imageUrl: (detail.photos?.[0]) || p.c.img || undefined,
        sourceUrl: p.sourceUrl,
        searchMode: "residential",
        beds: detail.beds,
        baths: detail.baths,
        garageSpaces: detail.garageSpaces,
        stories: detail.stories,
        propSubType: detail.propertyType,
        rawData: {
          addressText: p.c.addressText,
          priceText: p.c.priceText,
          sqftText: p.c.sqftText,
          typeText: p.c.typeText,
          brokerText: p.c.brokerText,
          fullText: p.c.fullText.substring(0, 500),
          detailPhotos: detail.photos,
        },
      });

      // Save progress every 20 listings
      if (listings.length % 20 === 0) {
        savePartial();
        console.log(`[aln] Progress: ${listings.length}/${allCards.length} listings processed`);
      }
    }

    savePartial();
  } finally {
    try { await context.close(); } catch {}
  }

  console.log(`[aln] Total listings scraped: ${listings.length}`);
  return listings;
}
