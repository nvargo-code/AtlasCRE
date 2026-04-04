import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/market-snapshot?zip=78704
 *
 * Quick market snapshot for a ZIP code — used in listing detail,
 * neighborhood pages, and agent tools. Returns:
 * - Active listing count
 * - Median price
 * - Average days on market
 * - Inventory trend (up/down/flat vs last month)
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get("zip");
  if (!zip) return NextResponse.json({ error: "zip required" }, { status: 400 });

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      activeCount,
      priceData,
      listings,
      lastMonthCount,
      newListings30d,
    ] = await Promise.all([
      prisma.listing.count({ where: { zip, status: "active", searchMode: "residential" } }),
      prisma.listing.aggregate({
        where: { zip, status: "active", searchMode: "residential", priceAmount: { not: null } },
        _avg: { priceAmount: true },
      }),
      prisma.listing.findMany({
        where: { zip, status: "active", searchMode: "residential" },
        select: { createdAt: true, priceAmount: true },
      }),
      // Count listings that existed 30 days ago (approximate by createdAt < 30d ago)
      prisma.listing.count({
        where: { zip, searchMode: "residential", createdAt: { lt: thirtyDaysAgo, gt: sixtyDaysAgo } },
      }),
      prisma.listing.count({
        where: { zip, searchMode: "residential", createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Calculate median
    const prices = listings
      .filter((l) => l.priceAmount)
      .map((l) => Number(l.priceAmount))
      .sort((a, b) => a - b);
    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : null;

    // Average DOM
    const doms = listings.map((l) => Math.floor((now.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    const avgDOM = doms.length > 0 ? Math.round(doms.reduce((a, b) => a + b, 0) / doms.length) : null;

    // Inventory trend
    const trend = activeCount > lastMonthCount * 1.1 ? "up" : activeCount < lastMonthCount * 0.9 ? "down" : "flat";

    return NextResponse.json({
      zip,
      activeListings: activeCount,
      medianPrice,
      avgPrice: priceData._avg.priceAmount ? Math.round(Number(priceData._avg.priceAmount)) : null,
      avgDaysOnMarket: avgDOM,
      newListings30d,
      inventoryTrend: trend,
    });
  } catch (e) {
    console.error("[market-snapshot] Error:", e);
    return NextResponse.json({ error: "Failed to generate snapshot" }, { status: 500 });
  }
}
