import { ListingProvider, NormalizedListing } from "../types";

/**
 * Realtor.com commercial listings adapter.
 *
 * TODO: Implement actual API integration.
 * - Realtor.com has an unofficial API at realtor.com/api/v1/hulk
 * - Consider using their search endpoint with commercial filters
 * - Rate limit: be respectful, add delays between requests
 */
export const realtorProvider: ListingProvider = {
  slug: "realtor",
  name: "Realtor.com",

  async fetchListings(market): Promise<NormalizedListing[]> {
    console.log(`[realtor] Fetching ${market} listings... (stub)`);

    // TODO: Replace with actual API calls
    // Example implementation outline:
    // 1. Build search params for market area bounds
    // 2. Fetch paginated results from Realtor.com API
    // 3. Normalize each result to NormalizedListing format
    // 4. Handle pagination (offset-based)

    return [];
  },
};
