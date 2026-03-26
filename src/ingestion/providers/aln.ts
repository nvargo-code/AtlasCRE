import { ListingProvider, NormalizedListing } from "../types";

/**
 * Austin Luxury Network (ALN) adapter.
 * ALN is a private, members-only listing platform at austinluxurynetwork.com.
 * Delegates to the DigitalOcean scraper microservice which handles login + scraping.
 *
 * ALN only covers Austin — DFW market calls return empty.
 *
 * Required env vars:
 *   SCRAPER_SERVICE_URL  e.g. http://134.209.172.184:3333
 *   SCRAPER_SECRET       shared bearer token
 */

export const alnProvider: ListingProvider = {
  slug: "aln",
  name: "Austin Luxury Network",

  async fetchListings(market): Promise<NormalizedListing[]> {
    // ALN is Austin-only
    if (market !== "austin") return [];

    const baseUrl = process.env.SCRAPER_SERVICE_URL;
    if (!baseUrl) {
      console.warn("[aln] SCRAPER_SERVICE_URL not set — skipping");
      return [];
    }

    console.log("[aln] Requesting listings from scraper service...");

    const res = await fetch(`${baseUrl}/scrape/aln`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SCRAPER_SECRET ?? ""}`,
      },
      body: JSON.stringify({ market }),
      signal: AbortSignal.timeout(270_000),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Scraper service error ${res.status}: ${body}`);
    }

    const listings: NormalizedListing[] = await res.json();
    console.log(`[aln] ${listings.length} listings`);
    return listings;
  },
};
