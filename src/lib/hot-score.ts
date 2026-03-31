/**
 * Hot Score — Per-listing competitiveness prediction
 *
 * 0-100 score predicting how quickly a listing will sell and how
 * competitive it is. Combines multiple signals with transparent reasoning.
 *
 * Signals:
 * 1. Save velocity — how many users saved this in last 48 hours
 * 2. View velocity — page views in last 48 hours
 * 3. Price vs comps — is it priced below, at, or above similar sold homes?
 * 4. Days on market — how long has it been listed?
 * 5. Area competitiveness — how fast are homes in this ZIP selling?
 * 6. Photo quality proxy — number of photos (more photos = more engagement)
 * 7. Showing request count — how many tours have been requested?
 * 8. Price change history — was the price recently reduced? (signals motivation)
 *
 * Each signal contributes 0-12.5 points, totaling 0-100.
 */

import { prisma } from "./prisma";

interface HotScoreSignals {
  saveVelocity: number;      // saves in last 48h
  viewVelocity: number;      // views in last 48h
  priceVsComps: number;      // % below/above area median (-10 to +10)
  daysOnMarket: number;      // days since listed
  areaAvgDOM: number;        // average DOM for this ZIP
  photoCount: number;        // number of photos
  showingRequests: number;   // tour requests
  priceReduced: boolean;     // price has been reduced
}

interface ScoreResult {
  score: number;
  signals: HotScoreSignals;
  reasoning: string;
  breakdown: { signal: string; points: number; detail: string }[];
}

export async function calculateHotScore(listingId: string): Promise<ScoreResult> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true, zip: true, priceAmount: true, createdAt: true,
      searchMode: true, city: true, imageUrl: true,
      photos: { select: { id: true } },
    },
  });

  if (!listing) throw new Error("Listing not found");

  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // 1. Save velocity (favorites in last 48h)
  const saveCount = await prisma.listingActivity.count({
    where: {
      listingId,
      action: "save",
      createdAt: { gte: fortyEightHoursAgo },
    },
  });

  // 2. View velocity (views in last 48h)
  const viewCount = await prisma.listingActivity.count({
    where: {
      listingId,
      action: "view",
      createdAt: { gte: fortyEightHoursAgo },
    },
  });

  // 3. Price vs comps (compare to median price in same ZIP)
  const areaMedian = await prisma.listing.aggregate({
    where: {
      zip: listing.zip,
      searchMode: listing.searchMode,
      status: "active",
      priceAmount: { not: null },
    },
    _avg: { priceAmount: true },
  });
  const avgPrice = areaMedian._avg.priceAmount ? Number(areaMedian._avg.priceAmount) : 0;
  const listingPrice = listing.priceAmount ? Number(listing.priceAmount) : 0;
  const priceVsComps = avgPrice > 0 ? ((listingPrice - avgPrice) / avgPrice) * 100 : 0;

  // 4. Days on market
  const daysOnMarket = Math.floor((now.getTime() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // 5. Area average DOM
  const areaListings = await prisma.listing.findMany({
    where: { zip: listing.zip, searchMode: listing.searchMode, status: "active" },
    select: { createdAt: true },
  });
  const areaAvgDOM = areaListings.length > 0
    ? areaListings.reduce((sum, l) => sum + Math.floor((now.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24)), 0) / areaListings.length
    : 30;

  // 6. Photo count
  const photoCount = listing.photos.length + (listing.imageUrl ? 1 : 0);

  // 7. Showing requests
  const showingRequests = await prisma.showingRequest.count({
    where: { listingId },
  });

  // 8. Price reduced (check if current price < any variant's price)
  const higherVariant = await prisma.listingVariant.findFirst({
    where: {
      listingId,
      priceAmount: listingPrice > 0 ? { gt: listingPrice } : undefined,
    },
  });
  const priceReduced = !!higherVariant;

  // ── Score each signal ──────────────────────────────────────────────────

  const breakdown: { signal: string; points: number; detail: string }[] = [];
  let totalScore = 0;

  // Save velocity (0-12.5 points) — more saves = hotter
  const savePoints = Math.min(12.5, saveCount * 2.5);
  breakdown.push({
    signal: "Save Velocity",
    points: Math.round(savePoints * 10) / 10,
    detail: `${saveCount} saves in the last 48 hours${saveCount >= 5 ? " — high demand" : saveCount >= 2 ? " — moderate interest" : ""}`,
  });
  totalScore += savePoints;

  // View velocity (0-12.5 points) — more views = hotter
  const viewPoints = Math.min(12.5, viewCount * 0.5);
  breakdown.push({
    signal: "View Velocity",
    points: Math.round(viewPoints * 10) / 10,
    detail: `${viewCount} views in the last 48 hours`,
  });
  totalScore += viewPoints;

  // Price vs comps (0-12.5 points) — below average = hotter
  const pricePoints = priceVsComps < -10 ? 12.5
    : priceVsComps < -5 ? 10
    : priceVsComps < 0 ? 7.5
    : priceVsComps < 5 ? 5
    : priceVsComps < 10 ? 2.5
    : 0;
  breakdown.push({
    signal: "Price vs. Area",
    points: pricePoints,
    detail: priceVsComps < 0
      ? `Priced ${Math.abs(Math.round(priceVsComps))}% below area average — good value`
      : priceVsComps > 0
      ? `Priced ${Math.round(priceVsComps)}% above area average`
      : "Priced at area average",
  });
  totalScore += pricePoints;

  // Days on market (0-12.5 points) — newer = hotter
  const domPoints = daysOnMarket <= 3 ? 12.5
    : daysOnMarket <= 7 ? 10
    : daysOnMarket <= 14 ? 7.5
    : daysOnMarket <= 30 ? 5
    : daysOnMarket <= 60 ? 2.5
    : 0;
  breakdown.push({
    signal: "Days on Market",
    points: domPoints,
    detail: `${daysOnMarket} days${daysOnMarket <= 7 ? " — brand new listing" : daysOnMarket <= 14 ? " — still fresh" : ""}`,
  });
  totalScore += domPoints;

  // Area competitiveness (0-12.5 points) — faster area avg = hotter
  const areaPoints = areaAvgDOM <= 10 ? 12.5
    : areaAvgDOM <= 20 ? 10
    : areaAvgDOM <= 30 ? 7.5
    : areaAvgDOM <= 45 ? 5
    : areaAvgDOM <= 60 ? 2.5
    : 0;
  breakdown.push({
    signal: "Area Speed",
    points: areaPoints,
    detail: `Homes in ${listing.zip || listing.city} average ${Math.round(areaAvgDOM)} days on market${areaAvgDOM <= 15 ? " — very fast-moving area" : ""}`,
  });
  totalScore += areaPoints;

  // Photo count (0-12.5 points) — more photos = more engagement
  const photoPoints = photoCount >= 20 ? 12.5
    : photoCount >= 10 ? 10
    : photoCount >= 5 ? 7.5
    : photoCount >= 2 ? 5
    : photoCount >= 1 ? 2.5
    : 0;
  breakdown.push({
    signal: "Listing Quality",
    points: photoPoints,
    detail: `${photoCount} photos${photoCount >= 10 ? " — well-presented listing" : photoCount === 0 ? " — no photos yet" : ""}`,
  });
  totalScore += photoPoints;

  // Showing requests (0-12.5 points)
  const showingPoints = Math.min(12.5, showingRequests * 3);
  breakdown.push({
    signal: "Tour Demand",
    points: Math.round(showingPoints * 10) / 10,
    detail: `${showingRequests} showing requests${showingRequests >= 3 ? " — strong demand" : ""}`,
  });
  totalScore += showingPoints;

  // Price reduced bonus (0-12.5 points)
  const reducePoints = priceReduced ? 8 : 0;
  if (priceReduced) {
    breakdown.push({
      signal: "Price Reduced",
      points: reducePoints,
      detail: "Price has been reduced — seller is motivated",
    });
    totalScore += reducePoints;
  }

  const score = Math.min(100, Math.round(totalScore));

  // Build reasoning
  const topSignals = breakdown
    .filter((b) => b.points >= 5)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  let reasoning: string;
  if (score >= 80) {
    reasoning = `This home is very likely to sell quickly. ${topSignals.map((s) => s.detail).join(". ")}.`;
  } else if (score >= 60) {
    reasoning = `This home is competitive. ${topSignals.map((s) => s.detail).join(". ")}.`;
  } else if (score >= 40) {
    reasoning = `This home has moderate interest. ${topSignals.map((s) => s.detail).join(". ")}.`;
  } else {
    reasoning = `This home may have room for negotiation. ${topSignals.length > 0 ? topSignals.map((s) => s.detail).join(". ") + "." : "Limited activity signals."}`;
  }

  return {
    score,
    signals: {
      saveVelocity: saveCount,
      viewVelocity: viewCount,
      priceVsComps: Math.round(priceVsComps * 10) / 10,
      daysOnMarket,
      areaAvgDOM: Math.round(areaAvgDOM),
      photoCount,
      showingRequests,
      priceReduced,
    },
    reasoning,
    breakdown,
  };
}

/**
 * Calculate and store hot scores for all active listings.
 * Run this on a schedule (e.g., every 6 hours).
 */
export async function updateAllHotScores(): Promise<{ updated: number; errors: number }> {
  const listings = await prisma.listing.findMany({
    where: { status: "active" },
    select: { id: true },
  });

  let updated = 0;
  let errors = 0;

  for (const listing of listings) {
    try {
      const result = await calculateHotScore(listing.id);
      await prisma.hotScore.upsert({
        where: { listingId: listing.id },
        create: {
          listingId: listing.id,
          score: result.score,
          signals: result.signals as object,
          reasoning: result.reasoning,
        },
        update: {
          score: result.score,
          signals: result.signals as object,
          reasoning: result.reasoning,
        },
      });
      updated++;
    } catch {
      errors++;
    }
  }

  return { updated, errors };
}
