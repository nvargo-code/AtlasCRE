import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/market-trends?zip=78704&months=12&searchMode=residential
 *
 * Returns monthly market trend data for charts:
 * - Price trends (median, avg)
 * - Inventory (active listing count per month)
 * - Price per sqft trends
 * - New listings per month
 *
 * Also accepts ?zips=78704,78702 for multi-zip neighborhoods.
 */

export const dynamic = "force-dynamic";

interface MonthBucket {
  month: string; // "2026-01"
  label: string; // "Jan 2026"
  medianPrice: number | null;
  avgPrice: number | null;
  avgPricePerSqft: number | null;
  activeListings: number;
  newListings: number;
  priceChanges: number;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const zip = params.get("zip");
  const zipsParam = params.get("zips");
  const months = Math.min(Number(params.get("months") || "12"), 24);
  const searchMode = params.get("searchMode") || "residential";

  const zips = zipsParam
    ? zipsParam.split(",").map((z) => z.trim())
    : zip
      ? [zip]
      : [];

  if (zips.length === 0) {
    return NextResponse.json({ error: "zip or zips parameter required" }, { status: 400 });
  }

  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    // Get all listings in these zips (active or sold) created within the timeframe
    const listings = await prisma.listing.findMany({
      where: {
        zip: { in: zips },
        searchMode,
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        priceAmount: true,
        buildingSf: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Get price history events for these zips
    const priceEvents = await prisma.priceHistory.findMany({
      where: {
        listing: { zip: { in: zips }, searchMode },
        changeDate: { gte: startDate },
      },
      select: {
        event: true,
        changeDate: true,
      },
    });

    // Get current active count for the most recent snapshot
    const currentActiveCount = await prisma.listing.count({
      where: {
        zip: { in: zips },
        searchMode,
        status: "active",
      },
    });

    // Bucket data by month
    const buckets = new Map<string, MonthBucket>();

    for (let i = 0; i <= months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - months + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      buckets.set(key, {
        month: key,
        label,
        medianPrice: null,
        avgPrice: null,
        avgPricePerSqft: null,
        activeListings: 0,
        newListings: 0,
        priceChanges: 0,
      });
    }

    // Count new listings per month and collect prices
    const pricesByMonth = new Map<string, number[]>();
    const psfByMonth = new Map<string, number[]>();

    for (const listing of listings) {
      const d = listing.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.newListings++;
        if (listing.priceAmount) {
          if (!pricesByMonth.has(key)) pricesByMonth.set(key, []);
          pricesByMonth.get(key)!.push(Number(listing.priceAmount));

          if (listing.buildingSf && listing.buildingSf > 0) {
            if (!psfByMonth.has(key)) psfByMonth.set(key, []);
            psfByMonth.get(key)!.push(Number(listing.priceAmount) / Number(listing.buildingSf));
          }
        }
      }
    }

    // Calculate median and avg prices per month
    for (const [key, prices] of pricesByMonth) {
      const bucket = buckets.get(key);
      if (!bucket || prices.length === 0) continue;

      prices.sort((a, b) => a - b);
      bucket.medianPrice = Math.round(prices[Math.floor(prices.length / 2)]);
      bucket.avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    }

    for (const [key, values] of psfByMonth) {
      const bucket = buckets.get(key);
      if (!bucket || values.length === 0) continue;
      bucket.avgPricePerSqft = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    // Count price changes per month
    for (const event of priceEvents) {
      if (event.event === "price_change") {
        const d = event.changeDate;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const bucket = buckets.get(key);
        if (bucket) bucket.priceChanges++;
      }
    }

    // Estimate active listings per month (rough: cumulative new - assume some drop off)
    // For the current month, use actual count
    const sortedBuckets = Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month));
    if (sortedBuckets.length > 0) {
      sortedBuckets[sortedBuckets.length - 1].activeListings = currentActiveCount;

      // Backfill estimate: for older months, scale from current count and new listings ratio
      let running = currentActiveCount;
      for (let i = sortedBuckets.length - 2; i >= 0; i--) {
        // Approximate: subtract net new from later months
        const later = sortedBuckets[i + 1];
        running = Math.max(0, running - Math.round(later.newListings * 0.3));
        sortedBuckets[i].activeListings = running;
      }
    }

    // Summary stats
    const allPrices = listings
      .filter((l) => l.priceAmount)
      .map((l) => Number(l.priceAmount));
    allPrices.sort((a, b) => a - b);

    const summary = {
      totalListings: currentActiveCount,
      medianPrice: allPrices.length > 0 ? allPrices[Math.floor(allPrices.length / 2)] : null,
      avgPrice: allPrices.length > 0 ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length) : null,
      totalNewListings: listings.length,
      totalPriceChanges: priceEvents.filter((e) => e.event === "price_change").length,
      zips,
      period: `${months} months`,
    };

    return NextResponse.json({
      summary,
      trends: sortedBuckets,
    });
  } catch (e) {
    console.error("[market-trends] Error:", e);
    return NextResponse.json({ error: "Failed to fetch market trends" }, { status: 500 });
  }
}
