/**
 * Post-Ingestion Hooks
 *
 * Called after new listings are ingested. Triggers:
 * 1. In-app notifications for agents about new listings
 * 2. Saved search alert matching (instant alerts)
 * 3. Price history recording for new listings
 */

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { buildListingWhere } from "@/lib/filters";
import { ListingFilters } from "@/types";

/**
 * Run all post-ingestion hooks for a newly created listing.
 */
export async function runPostIngestHooks(listingId: string): Promise<void> {
  try {
    await Promise.allSettled([
      notifyAgentsOfNewListing(listingId),
      checkInstantAlerts(listingId),
      recordNewListingHistory(listingId),
    ]);
  } catch (e) {
    console.error("[post-ingest] Hook error:", e);
  }
}

/**
 * Notify all agents about a new listing in their area.
 */
async function notifyAgentsOfNewListing(listingId: string): Promise<void> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { address: true, city: true, zip: true, priceAmount: true, searchMode: true },
  });
  if (!listing) return;

  const agents = await prisma.user.findMany({
    where: { role: { in: ["AGENT", "ADMIN"] } },
    select: { id: true },
  });

  const price = listing.priceAmount
    ? listing.priceAmount >= 1_000_000
      ? `$${(Number(listing.priceAmount) / 1_000_000).toFixed(1)}M`
      : `$${Math.round(Number(listing.priceAmount) / 1000)}K`
    : "";

  for (const agent of agents) {
    await createNotification({
      userId: agent.id,
      type: "system",
      title: `New listing: ${listing.address}`,
      body: `${listing.city} ${listing.zip || ""} ${price} — ${listing.searchMode}`,
      link: `/listings/${listingId}`,
      metadata: { listingId },
    });
  }
}

/**
 * Check if new listing matches any saved searches with instant alerts.
 */
async function checkInstantAlerts(listingId: string): Promise<void> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true, address: true, city: true, zip: true, priceAmount: true,
      beds: true, baths: true, buildingSf: true, searchMode: true,
      lat: true, lng: true, status: true, propertyType: true, listingType: true,
      market: true,
    },
  });
  if (!listing) return;

  // Get all instant-alert saved searches
  const searches = await prisma.savedSearch.findMany({
    where: {
      alertEnabled: true,
      alertFrequency: "instant",
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  for (const search of searches) {
    try {
      const filters = search.filters as unknown as ListingFilters;
      const where = buildListingWhere(filters);

      // Check if this specific listing matches the search criteria
      const match = await prisma.listing.findFirst({
        where: { ...where, id: listingId },
        select: { id: true },
      });

      if (match) {
        // Create notification
        await createNotification({
          userId: search.user.id,
          type: "new_listing_match",
          title: `New match: ${listing.address}`,
          body: `Matches your "${search.name}" search`,
          link: `/listings/${listingId}`,
          metadata: { listingId, searchId: search.id },
        });
      }
    } catch {
      // Skip failed searches silently
    }
  }
}

/**
 * Record a new_listing event in price history.
 */
async function recordNewListingHistory(listingId: string): Promise<void> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { priceAmount: true },
  });
  if (!listing?.priceAmount) return;

  await prisma.priceHistory.create({
    data: {
      listingId,
      event: "new_listing",
      newValue: Number(listing.priceAmount).toString(),
    },
  });
}
