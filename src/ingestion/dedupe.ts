import { NormalizedListing } from "./types";

/**
 * Generate a deduplication key from listing attributes.
 * Matches on normalized address + building SF + property type + broker name.
 */
export function generateDedupeKey(listing: NormalizedListing): string {
  const parts = [
    normalizeAddress(listing.address),
    listing.buildingSf?.toString() ?? "0",
    listing.propertyType.toLowerCase().trim(),
    (listing.brokerName ?? "unknown").toLowerCase().trim(),
  ];
  return parts.join("|");
}

function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/\./g, "")
    .replace(/\bstreet\b/g, "st")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\broad\b/g, "rd")
    .replace(/\blane\b/g, "ln")
    .replace(/\bcourt\b/g, "ct")
    .replace(/\bsuite\b/g, "ste")
    .replace(/\s+/g, " ");
}

/**
 * Group normalized listings by dedupe key.
 * First listing in each group becomes the master; rest become variants.
 */
export function deduplicateListings(
  listings: NormalizedListing[]
): Map<string, NormalizedListing[]> {
  const groups = new Map<string, NormalizedListing[]>();

  for (const listing of listings) {
    const key = generateDedupeKey(listing);
    const existing = groups.get(key);
    if (existing) {
      existing.push(listing);
    } else {
      groups.set(key, [listing]);
    }
  }

  return groups;
}
