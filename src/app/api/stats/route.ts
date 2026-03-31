import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/stats?north=...&south=...&east=...&west=...&searchMode=residential
 *
 * Returns aggregate market stats for the given map viewport.
 * Public endpoint — no auth required.
 */

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const north = Number(params.get("north"));
  const south = Number(params.get("south"));
  const east = Number(params.get("east"));
  const west = Number(params.get("west"));
  const searchMode = params.get("searchMode") || "residential";

  const where: Record<string, unknown> = {
    status: "active",
    searchMode,
  };

  if (north && south && east && west) {
    where.lat = { gte: south, lte: north };
    where.lng = { gte: west, lte: east };
  }

  try {
    const [count, priceAgg, sqftAgg] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.aggregate({
        where: { ...where, priceAmount: { not: null } },
        _avg: { priceAmount: true },
        _min: { priceAmount: true },
        _max: { priceAmount: true },
        _count: { priceAmount: true },
      }),
      prisma.listing.aggregate({
        where: { ...where, buildingSf: { not: null }, priceAmount: { not: null } },
        _avg: { buildingSf: true },
      }),
    ]);

    // Calculate median price (approximate via sorting middle value)
    let medianPrice: number | null = null;
    const priceCount = priceAgg._count.priceAmount;
    if (priceCount > 0) {
      const midListing = await prisma.listing.findMany({
        where: { ...where, priceAmount: { not: null } },
        orderBy: { priceAmount: "asc" },
        skip: Math.floor(priceCount / 2),
        take: 1,
        select: { priceAmount: true },
      });
      medianPrice = midListing[0]?.priceAmount ? Number(midListing[0].priceAmount) : null;
    }

    // Avg price per sqft
    let avgPricePerSqft: number | null = null;
    if (priceAgg._avg.priceAmount && sqftAgg._avg.buildingSf) {
      avgPricePerSqft = Math.round(Number(priceAgg._avg.priceAmount) / Number(sqftAgg._avg.buildingSf));
    }

    return NextResponse.json({
      totalListings: count,
      avgPrice: priceAgg._avg.priceAmount ? Math.round(Number(priceAgg._avg.priceAmount)) : null,
      medianPrice: medianPrice ? Math.round(medianPrice) : null,
      minPrice: priceAgg._min.priceAmount ? Math.round(Number(priceAgg._min.priceAmount)) : null,
      maxPrice: priceAgg._max.priceAmount ? Math.round(Number(priceAgg._max.priceAmount)) : null,
      avgPricePerSqft,
      avgSqft: sqftAgg._avg.buildingSf ? Math.round(Number(sqftAgg._avg.buildingSf)) : null,
    });
  } catch (e) {
    console.error("[stats] Error:", e);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
