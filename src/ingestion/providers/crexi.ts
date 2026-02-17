import { ListingProvider, NormalizedListing } from "../types";

/**
 * Crexi commercial listings adapter.
 *
 * TODO: Implement actual API integration.
 * - Crexi has a GraphQL API used by their frontend
 * - Inspect network requests at crexi.com/properties for schema
 * - Filter by market area (Austin/DFW geographic bounds)
 */
export const crexiProvider: ListingProvider = {
  slug: "crexi",
  name: "Crexi",

  async fetchListings(market): Promise<NormalizedListing[]> {
    console.log(`[crexi] Fetching ${market} listings... (stub)`);
    return [];
  },
};
