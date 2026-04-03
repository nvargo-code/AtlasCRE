import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyPriceChange } from "@/lib/notifications";

/**
 * GET /api/ingest/status-tracker
 *
 * Tracks listing status changes (active → pending → sold → expired).
 * Records changes in PriceHistory for CMA and market trend analysis.
 *
 * Runs as a cron job alongside the main ingestion pipeline.
 * Checks listings against their source variants for status/price changes.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    listingsChecked: 0,
    statusChanges: 0,
    priceChanges: 0,
    newSold: 0,
    errors: 0,
  };

  try {
    // Get all active listings that have been around for a while
    // Check in batches to avoid memory issues
    const batchSize = 100;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const listings = await prisma.listing.findMany({
        where: {
          status: { in: ["active", "pending"] },
        },
        select: {
          id: true,
          address: true,
          status: true,
          priceAmount: true,
          createdAt: true,
          updatedAt: true,
          variants: {
            select: {
              priceAmount: true,
              fetchedAt: true,
              source: { select: { slug: true } },
            },
            orderBy: { fetchedAt: "desc" },
            take: 1,
          },
        },
        skip,
        take: batchSize,
        orderBy: { updatedAt: "asc" },
      });

      if (listings.length < batchSize) hasMore = false;
      skip += batchSize;

      for (const listing of listings) {
        results.listingsChecked++;

        try {
          // Check for price changes from latest variant
          const latestVariant = listing.variants[0];
          if (latestVariant && latestVariant.priceAmount) {
            const currentPrice = listing.priceAmount ? Number(listing.priceAmount) : null;
            const variantPrice = Number(latestVariant.priceAmount);

            if (currentPrice && Math.abs(currentPrice - variantPrice) > 1) {
              // Price changed — record it
              await prisma.priceHistory.create({
                data: {
                  listingId: listing.id,
                  event: "price_change",
                  oldValue: currentPrice.toString(),
                  newValue: variantPrice.toString(),
                },
              });

              // Update listing price
              await prisma.listing.update({
                where: { id: listing.id },
                data: { priceAmount: variantPrice },
              });

              results.priceChanges++;

              // Notify users who favorited this listing
              try {
                const favorites = await prisma.favoriteListing.findMany({
                  where: { listingId: listing.id },
                  select: { userId: true },
                });
                const oldPriceStr = currentPrice >= 1_000_000
                  ? `$${(currentPrice / 1_000_000).toFixed(2)}M`
                  : `$${currentPrice.toLocaleString()}`;
                const newPriceStr = variantPrice >= 1_000_000
                  ? `$${(variantPrice / 1_000_000).toFixed(2)}M`
                  : `$${variantPrice.toLocaleString()}`;
                for (const fav of favorites) {
                  await notifyPriceChange(
                    fav.userId,
                    listing.address,
                    listing.id,
                    oldPriceStr,
                    newPriceStr
                  );
                }
              } catch {
                // Don't fail the tracker if notifications fail
              }
            }
          }

          // Check for stale listings (not updated in 30+ days) — likely sold or expired
          const daysSinceUpdate = (Date.now() - new Date(listing.updatedAt).getTime()) / (1000 * 60 * 60 * 24);

          if (daysSinceUpdate > 30 && listing.status === "active") {
            // Mark as likely sold/expired
            await prisma.priceHistory.create({
              data: {
                listingId: listing.id,
                event: "status_change",
                oldValue: listing.status,
                newValue: "sold",
              },
            });

            await prisma.listing.update({
              where: { id: listing.id },
              data: { status: "sold" },
            });

            results.statusChanges++;
            results.newSold++;
          }
        } catch (e) {
          results.errors++;
          console.error(`[status-tracker] Error processing listing ${listing.id}:`, e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[status-tracker] Fatal error:", e);
    return NextResponse.json({ error: "Status tracker failed", details: String(e) }, { status: 500 });
  }
}
