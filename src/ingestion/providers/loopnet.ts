import { ListingProvider, NormalizedListing } from "../types";

/**
 * LoopNet commercial listings adapter.
 *
 * TODO: Implement actual scraping/API integration.
 * - LoopNet is owned by CoStar; no public API
 * - May need headless browser (Playwright) or structured data scraping
 * - Check robots.txt and terms of service
 * - Consider using their search results page with geographic filters
 */
export const loopnetProvider: ListingProvider = {
  slug: "loopnet",
  name: "LoopNet",

  async fetchListings(market): Promise<NormalizedListing[]> {
    console.log(`[loopnet] Fetching ${market} listings... (stub)`);
    return [];
  },
};
