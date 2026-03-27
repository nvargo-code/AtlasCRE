import { Browser, Page } from "playwright";
import { NormalizedListing } from "../types";

const MARKET_SEARCH_URLS: Record<string, string> = {
  austin: "https://www.loopnet.com/search/commercial-real-estate/austin-tx/for-sale/",
  dfw:    "https://www.loopnet.com/search/commercial-real-estate/dallas-fort-worth-tx/for-sale/",
};

const MARKET_LEASE_URLS: Record<string, string> = {
  austin: "https://www.loopnet.com/search/commercial-real-estate/austin-tx/for-lease/",
  dfw:    "https://www.loopnet.com/search/commercial-real-estate/dallas-fort-worth-tx/for-lease/",
};

async function ensureLoggedIn(page: Page): Promise<void> {
  const email = process.env.LOOPNET_EMAIL;
  const password = process.env.LOOPNET_PASSWORD;

  if (!email || !password) {
    throw new Error("LOOPNET_EMAIL and LOOPNET_PASSWORD env vars are required");
  }

  // Check if already logged in
  await page.goto("https://www.loopnet.com", { waitUntil: "domcontentloaded" });
  const isLoggedIn = await page.$("[data-testid='user-nav'], .user-menu, [aria-label='My Account']");
  if (isLoggedIn) return;

  // Navigate to login
  await page.goto("https://www.loopnet.com/login/", { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(3000);
  console.log("[loopnet] Login page URL:", page.url());

  // Take screenshot for debugging
  await page.screenshot({ path: "/tmp/loopnet-login.png" });
  console.log("[loopnet] Screenshot saved to /tmp/loopnet-login.png");

  // Fill login form — try broad selectors to handle LoopNet's varying form structure
  const emailInput = await page.waitForSelector(
    "input[type='email'], input[name='email'], input[name='Username'], input[name='username'], input[autocomplete='email'], input[autocomplete='username'], input[type='text']",
    { timeout: 15_000 }
  );
  await emailInput.fill(email);

  const passwordInput = await page.waitForSelector(
    "input[type='password'], input[name='password'], input[name='Password'], input[autocomplete='current-password']",
    { timeout: 5_000 }
  );
  await passwordInput.fill(password);

  // Submit
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => {}),
    page.click("button[type='submit'], input[type='submit'], .login-button, [data-testid='login-submit']"),
  ]);

  console.log("[loopnet] Login complete");
}

interface LoopNetRawListing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  lat: number;
  lng: number;
  propertyType: string;
  listingType: string;
  price?: string;
  priceAmount?: number;
  buildingSf?: number;
  broker?: string;
  brokerCompany?: string;
  imageUrl?: string;
  url?: string;
}

async function scrapeListingCards(page: Page, market: "austin" | "dfw", listingType: string): Promise<LoopNetRawListing[]> {
  const results: LoopNetRawListing[] = [];

  // Wait for listing cards to appear
  try {
    await page.waitForSelector(
      ".placard, .listing-card, [data-testid='listing-card'], .property-card",
      { timeout: 15_000 }
    );
  } catch {
    console.warn("[loopnet] No listing cards found on page");
    return results;
  }

  // Scrape all listing cards on current page
  const cards = await page.$$eval(
    ".placard, .listing-card, [data-testid='listing-card'], .property-card",
    (els) =>
      els.map((el) => {
        const getText = (sel: string) => el.querySelector(sel)?.textContent?.trim() ?? "";
        const getAttr = (sel: string, attr: string) => (el.querySelector(sel) as HTMLElement | null)?.getAttribute(attr) ?? "";

        const addressFull = getText(".address, .placard-title, [data-testid='address'], .listing-address")
          || getText("h2, h3");
        const price = getText(".price, .listing-price, [data-testid='price']");
        const propType = getText(".property-type, .asset-type, [data-testid='property-type']");
        const size = getText(".building-size, .size, [data-testid='building-size']");
        const broker = getText(".broker-name, .agent-name, [data-testid='broker']");
        const company = getText(".company-name, .brokerage, [data-testid='company']");
        const img = getAttr("img", "src");
        const link = getAttr("a", "href");
        const lat = (el as HTMLElement).dataset?.lat ?? "";
        const lng = (el as HTMLElement).dataset?.lng ?? "";

        return { addressFull, price, propType, size, broker, company, img, link, lat, lng };
      })
  );

  for (const card of cards) {
    if (!card.addressFull) continue;

    // Split "123 Main St, Austin, TX 78701" format
    const parts = card.addressFull.split(",").map((s: string) => s.trim());
    const address = parts[0] ?? card.addressFull;
    const cityStateZip = parts[1] ?? "";
    const cityMatch = cityStateZip.match(/^([^,]+)/);
    const city = cityMatch?.[1]?.trim() ?? (market === "austin" ? "Austin" : "Dallas");

    // Parse price
    let priceAmount: number | undefined;
    if (card.price) {
      const cleaned = card.price.replace(/[^0-9.]/g, "");
      const val = parseFloat(cleaned);
      if (!isNaN(val)) {
        priceAmount = card.price.includes("M") ? val * 1_000_000
          : card.price.includes("K") ? val * 1_000
          : val;
      }
    }

    // Parse building SF
    let buildingSf: number | undefined;
    if (card.size) {
      const sfMatch = card.size.match(/([\d,]+)\s*(?:SF|sq\.?\s*ft)/i);
      if (sfMatch) buildingSf = parseInt(sfMatch[1].replace(/,/g, ""));
    }

    const lat = parseFloat(card.lat) || 0;
    const lng = parseFloat(card.lng) || 0;

    // Generate a stable ID from URL or address
    const url = card.link?.startsWith("http") ? card.link : card.link ? `https://www.loopnet.com${card.link}` : undefined;
    const id = url ? url.split("/").filter(Boolean).pop() ?? address : address;

    results.push({
      id: id.replace(/\s+/g, "-").toLowerCase(),
      address,
      city,
      state: "TX",
      lat,
      lng,
      propertyType: card.propType || "Commercial",
      listingType,
      price: card.price,
      priceAmount,
      buildingSf,
      broker: card.broker,
      brokerCompany: card.company,
      imageUrl: card.img || undefined,
      url,
    });
  }

  return results;
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

export async function scrapeLoopNet(
  browser: Browser,
  market: "austin" | "dfw"
): Promise<NormalizedListing[]> {
  const proxyUrl = process.env.LOOPNET_PROXY_URL;
  const contextOptions: Parameters<Browser["newContext"]>[0] = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  };
  if (proxyUrl) {
    const u = new URL(proxyUrl);
    contextOptions.proxy = {
      server: `${u.protocol}//${u.hostname}:${u.port}`,
      username: u.username,
      password: u.password,
    };
    console.log(`[loopnet] Using proxy: ${u.hostname}:${u.port}`);
  }
  const context = await browser.newContext(contextOptions);

  const page = await context.newPage();
  const listings: NormalizedListing[] = [];

  try {
    await ensureLoggedIn(page);

    for (const [listingType, searchUrl] of [
      ["sale", MARKET_SEARCH_URLS[market]],
      ["lease", MARKET_LEASE_URLS[market]],
    ]) {
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(2000);

      // Scrape up to 5 pages
      for (let p = 1; p <= 5; p++) {
        const raw = await scrapeListingCards(page, market, listingType as string);
        if (raw.length === 0) break;

        for (const item of raw) {
          let lat = item.lat;
          let lng = item.lng;

          // Geocode if coordinates weren't in the card
          if (!lat || !lng) {
            const geo = await geocodeAddress(item.address, item.city, item.state);
            if (!geo) continue;
            lat = geo.lat;
            lng = geo.lng;
            await new Promise((r) => setTimeout(r, 200)); // rate limit geocoder
          }

          listings.push({
            externalId: item.id,
            sourceSlug: "loopnet",
            address: item.address,
            city: item.city,
            state: item.state,
            zip: item.zip,
            lat,
            lng,
            market,
            propertyType: item.propertyType,
            listingType: item.listingType,
            buildingSf: item.buildingSf,
            priceAmount: item.priceAmount,
            priceUnit: item.listingType === "lease" ? "$/SF/yr" : "total",
            brokerName: item.broker,
            brokerCompany: item.brokerCompany,
            imageUrl: item.imageUrl,
            sourceUrl: item.url,
            rawData: item as unknown as Record<string, unknown>,
          });
        }

        // Try to click next page
        const nextBtn = await page.$("[aria-label='Next page'], .next-page, [data-testid='pagination-next']");
        if (!nextBtn) break;
        await Promise.all([
          page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15_000 }),
          nextBtn.click(),
        ]);
        await page.waitForTimeout(1500);
      }
    }
  } finally {
    await context.close();
  }

  return listings;
}
