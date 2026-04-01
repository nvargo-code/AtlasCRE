import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/recommendations
 *
 * Returns personalized listing recommendations based on the user's
 * saved homes, search behavior, and viewed listings.
 *
 * Algorithm:
 * 1. Look at user's saved/favorited listings
 * 2. Extract preference signals: avg price, preferred beds/baths, common ZIPs
 * 3. Find active listings matching those signals that user hasn't seen
 */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  // Get user's saved listings to understand preferences
  const favorites = await prisma.favoriteListing.findMany({
    where: { userId },
    include: {
      listing: {
        select: {
          priceAmount: true, beds: true, baths: true, buildingSf: true,
          zip: true, city: true, searchMode: true, propertyType: true,
        },
      },
    },
  });

  // Also get recently viewed listings
  const recentViews = await prisma.listingActivity.findMany({
    where: { userId, action: "view" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      listing: {
        select: {
          priceAmount: true, beds: true, baths: true, zip: true,
          city: true, searchMode: true,
        },
      },
    },
  });

  // Combine signals
  const allSignals = [
    ...favorites.map((f) => f.listing),
    ...recentViews.map((v) => v.listing).filter(Boolean),
  ].filter(Boolean);

  if (allSignals.length === 0) {
    // No signals — return popular/recent listings
    const popular = await prisma.listing.findMany({
      where: { status: "active", searchMode: "residential" },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true, address: true, city: true, priceAmount: true, priceUnit: true,
        beds: true, baths: true, buildingSf: true, imageUrl: true,
        listingType: true, propSubType: true,
      },
    });

    return NextResponse.json({
      recommendations: popular.map((l) => ({
        ...l,
        priceAmount: l.priceAmount ? Number(l.priceAmount) : null,
        reason: "New to market",
      })),
      source: "popular",
    });
  }

  // Calculate preference signals
  const prices = allSignals.map((l) => l.priceAmount ? Number(l.priceAmount) : null).filter(Boolean) as number[];
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  const beds = allSignals.map((l) => l.beds).filter(Boolean) as number[];
  const avgBeds = beds.length > 0 ? Math.round(beds.reduce((a, b) => a + b, 0) / beds.length) : null;
  const zips = allSignals.map((l) => l.zip).filter(Boolean) as string[];
  const zipCounts: Record<string, number> = {};
  zips.forEach((z) => { zipCounts[z] = (zipCounts[z] || 0) + 1; });
  const topZips = Object.entries(zipCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([z]) => z);

  // Get IDs to exclude (already saved or viewed)
  const savedIds = favorites.map((f) => f.listingId);
  const viewedIds = recentViews.map((v) => v.listingId);
  const excludeIds = [...new Set([...savedIds, ...viewedIds])];

  // Build query for recommendations
  const where: Record<string, unknown> = {
    status: "active",
    id: { notIn: excludeIds },
    searchMode: allSignals[0]?.searchMode || "residential",
  };

  // Price range: +/- 30% of average
  if (avgPrice) {
    where.priceAmount = {
      gte: avgPrice * 0.7,
      lte: avgPrice * 1.3,
    };
  }

  // Prefer same areas
  if (topZips.length > 0) {
    where.OR = [
      { zip: { in: topZips } },
      ...(avgBeds ? [{ beds: { gte: avgBeds - 1, lte: avgBeds + 1 } }] : []),
    ];
  }

  const recommendations = await prisma.listing.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: {
      id: true, address: true, city: true, zip: true,
      priceAmount: true, priceUnit: true,
      beds: true, baths: true, buildingSf: true,
      imageUrl: true, listingType: true, propSubType: true,
    },
  });

  // Add reasoning
  const withReasons = recommendations.map((l) => {
    const reasons: string[] = [];
    if (topZips.includes(l.zip || "")) reasons.push(`In your preferred area (${l.zip})`);
    if (avgPrice && l.priceAmount) {
      const diff = Math.round(((Number(l.priceAmount) - avgPrice) / avgPrice) * 100);
      if (Math.abs(diff) <= 10) reasons.push("Similar to your price range");
      else if (diff < 0) reasons.push(`${Math.abs(diff)}% below your average`);
    }
    if (avgBeds && l.beds && Math.abs(l.beds - avgBeds) <= 1) reasons.push("Matches your size preference");

    return {
      ...l,
      priceAmount: l.priceAmount ? Number(l.priceAmount) : null,
      reason: reasons[0] || "You might like this",
    };
  });

  return NextResponse.json({
    recommendations: withReasons,
    source: "personalized",
    signals: {
      avgPrice: avgPrice ? Math.round(avgPrice) : null,
      avgBeds,
      topZips,
      totalSignals: allSignals.length,
    },
  });
}
