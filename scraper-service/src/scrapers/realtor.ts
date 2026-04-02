import { Browser, chromium as playwrightChromium } from "playwright";
import { chromium as stealthChromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

stealthChromium.use(StealthPlugin());
import { NormalizedListing } from "../types";

const MARKET_URLS: Record<string, string> = {
  austin: "https://www.realtor.com/realestateandhomes-search/Austin_TX",
  dfw:    "https://www.realtor.com/realestateandhomes-search/Dallas_TX",
};

interface RealtorProperty {
  property_id?: string;
  listing_id?: string;
  list_price?: number;
  status?: string;
  permalink?: string;
  description?: {
    beds?: number;
    baths_full?: number;
    sqft?: number;
    type?: string;
    sub_type?: string;
    year_built?: number;
    text?: string;
  };
  location?: {
    address?: {
      line?: string;
      city?: string;
      state_code?: string;
      postal_code?: string;
      coordinate?: { lat?: number; lon?: number };
    };
  };
  primary_photo?: { href?: string };
  agents?: Array<{
    name?: string;
    office?: { name?: string };
    phones?: Array<{ number?: string; type?: string }>;
    email?: string;
  }>;
}

function normalizeProperty(prop: RealtorProperty, market: "austin" | "dfw"): NormalizedListing | null {
  const addr = prop.location?.address;
  const address = addr?.line ?? "";
  const city = addr?.city ?? "";
  const state = addr?.state_code ?? "TX";
  const zip = addr?.postal_code;
  const lat = addr?.coordinate?.lat ?? 0;
  const lng = addr?.coordinate?.lon ?? 0;

  if (!address || !city || !lat || !lng) return null;

  const id = prop.property_id ?? prop.listing_id;
  if (!id) return null;

  const agent = prop.agents?.[0];
  const phone = agent?.phones?.find((p) => p.type === "mobile" || p.type === "work")?.number
    ?? agent?.phones?.[0]?.number;

  return {
    externalId: String(id),
    sourceSlug: "realtor",
    address,
    city,
    state,
    zip,
    lat,
    lng,
    market,
    propertyType: prop.description?.type ?? "Residential",
    listingType: "sale",
    buildingSf: prop.description?.sqft,
    yearBuilt: prop.description?.year_built,
    priceAmount: prop.list_price,
    priceUnit: "total",
    brokerName: agent?.name,
    brokerCompany: agent?.office?.name,
    brokerPhone: phone,
    brokerEmail: agent?.email,
    description: prop.description?.text,
    imageUrl: prop.primary_photo?.href,
    sourceUrl: prop.permalink ? `https://www.realtor.com${prop.permalink}` : undefined,
    rawData: prop as Record<string, unknown>,
  };
}

export async function scrapeRealtor(
  _browser: Browser,
  market: "austin" | "dfw"
): Promise<NormalizedListing[]> {
  const proxyUrl = process.env.LOOPNET_PROXY_URL;
  const launchOptions: Parameters<typeof stealthChromium.launch>[0] = {
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  };
  if (proxyUrl) {
    const u = new URL(proxyUrl);
    launchOptions.proxy = {
      server: `${u.protocol}//${u.hostname}:${u.port}`,
      username: u.username,
      password: u.password,
    };
    console.log(`[realtor] Using proxy: ${u.hostname}:${u.port}`);
  }

  const browser = await stealthChromium.launch(launchOptions);
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  const listings: NormalizedListing[] = [];

  try {
    const baseUrl = MARKET_URLS[market];
    let pageNum = 1;

    while (pageNum <= 100) {
      const url = pageNum === 1 ? baseUrl : `${baseUrl}/pg-${pageNum}`;
      console.log(`[realtor] Loading page ${pageNum}: ${url}`);

      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(3000);

      const pageTitle = await page.title();
      const pageUrl = page.url();
      console.log(`[realtor] Page ${pageNum} loaded: "${pageTitle}" (${pageUrl})`);

      // Save screenshot for first page to diagnose bot detection
      if (pageNum === 1) {
        await page.screenshot({ path: "/tmp/realtor-page1.png" });
        console.log("[realtor] Screenshot saved to /tmp/realtor-page1.png");
      }

      // Extract __NEXT_DATA__ which contains pre-loaded listing results
      const nextData = await page.evaluate(() => {
        const el = document.getElementById("__NEXT_DATA__");
        if (!el) return null;
        try { return JSON.parse(el.textContent ?? ""); } catch { return null; }
      });

      if (!nextData) {
        // Log page source snippet to understand what we're getting
        const snippet = await page.evaluate(() => document.body?.innerText?.slice(0, 500) ?? "");
        console.warn(`[realtor] No __NEXT_DATA__ on page ${pageNum}. Page text: ${snippet}`);
        break;
      }

      // Dig into the Redux state for search results — try multiple known paths
      const searchResults =
        nextData?.props?.pageProps?.searchResults?.home_search ??
        nextData?.props?.pageProps?.initialReduxState?.searchResults?.home_search;

      const props: RealtorProperty[] =
        searchResults?.results ??
        nextData?.props?.pageProps?.properties ??
        [];

      const totalCount: number = searchResults?.count ?? 0;
      console.log(`[realtor] Page ${pageNum}: ${props.length} properties (total available: ${totalCount})`);

      if (props.length === 0) {
        console.log(`[realtor] No results on page ${pageNum} — stopping`);
        break;
      }

      for (const prop of props) {
        const normalized = normalizeProperty(prop, market);
        if (normalized) listings.push(normalized);
      }

      // Stop if we've collected all available listings
      if (totalCount > 0 && listings.length >= totalCount) {
        console.log(`[realtor] Collected all ${totalCount} listings — stopping`);
        break;
      }

      // Check if there's a next page link
      const hasNextPage = await page.$("[aria-label='Go to next page'], [data-testid='pagination-next'], a[href*='pg-']");
      if (!hasNextPage) {
        console.log(`[realtor] No next page button on page ${pageNum} — stopping`);
        break;
      }

      pageNum++;
    }
  } finally {
    await context.close();
    await browser.close();
  }

  console.log(`[realtor] ${market}: ${listings.length} total listings`);
  return listings;
}
