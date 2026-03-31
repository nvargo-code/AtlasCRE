import { ListingProvider, NormalizedListing } from "../types";

const SCRAPER_URL = process.env.SCRAPER_SERVICE_URL ?? "http://134.209.172.184:3333";
const SCRAPER_SECRET = process.env.SCRAPER_SECRET ?? "";

export const realtorProvider: ListingProvider = {
  slug: "realtor",
  name: "Realtor.com",

  async fetchListings(market): Promise<NormalizedListing[]> {
    console.log(`[realtor] Requesting scraper service for market=${market}`);

    const res = await fetch(`${SCRAPER_URL}/scrape/realtor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SCRAPER_SECRET}`,
      },
      body: JSON.stringify({ market }),
      signal: AbortSignal.timeout(300_000), // 5 min timeout
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Realtor scraper error: ${res.status} — ${msg.slice(0, 200)}`);
    }

    const listings: NormalizedListing[] = await res.json();
    console.log(`[realtor] ${market}: ${listings.length} listings from scraper`);
    return listings;
  },
};
