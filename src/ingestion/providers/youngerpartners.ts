import { ListingProvider, NormalizedListing } from "../types";

/**
 * Younger Partners commercial listings adapter.
 *
 * TODO: Implement actual scraping.
 * - DFW-based CRE brokerage
 * - Scrape their property listings page
 * - May have a Yardi or similar backend with API
 */
export const youngerpartnersProvider: ListingProvider = {
  slug: "youngerpartners",
  name: "Younger Partners",

  async fetchListings(market): Promise<NormalizedListing[]> {
    if (market !== "dfw") return []; // DFW-only brokerage
    console.log(`[youngerpartners] Fetching ${market} listings... (stub)`);
    return [];
  },
};
