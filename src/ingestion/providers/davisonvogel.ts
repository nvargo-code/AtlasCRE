import { ListingProvider, NormalizedListing } from "../types";

/**
 * Davison & Vogel commercial listings adapter.
 *
 * TODO: Implement actual scraping.
 * - Local Austin CRE brokerage
 * - Scrape their property listings page
 * - May need to parse HTML or structured data
 */
export const davisonvogelProvider: ListingProvider = {
  slug: "davisonvogel",
  name: "Davison & Vogel",

  async fetchListings(market): Promise<NormalizedListing[]> {
    if (market !== "austin") return []; // Austin-only brokerage
    console.log(`[davisonvogel] Fetching ${market} listings... (stub)`);
    return [];
  },
};
