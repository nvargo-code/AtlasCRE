import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/portal/cma?address=123+Main&zip=78704&radius=0.5&beds=3&baths=2&sqftMin=1500&sqftMax=2500
 *
 * Finds comparable listings for a CMA (Comparative Market Analysis).
 * Returns subject property (if found) and comps sorted by similarity.
 *
 * Agent/Admin only.
 */

export const dynamic = "force-dynamic";

interface CompListing {
  id: string;
  address: string;
  city: string;
  zip: string | null;
  lat: number;
  lng: number;
  priceAmount: number | null;
  priceUnit: string | null;
  buildingSf: number | null;
  lotSizeAcres: number | null;
  beds: number | null;
  baths: number | null;
  yearBuilt: number | null;
  propertyType: string;
  propSubType: string | null;
  listingType: string;
  status: string;
  imageUrl: string | null;
  createdAt: Date;
  pricePerSqft: number | null;
  distance: number | null; // miles from subject
  similarityScore: number; // 0-100
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateSimilarity(
  subject: { beds: number | null; baths: number | null; buildingSf: number | null; yearBuilt: number | null; lat: number; lng: number },
  comp: { beds: number | null; baths: number | null; buildingSf: number | null; yearBuilt: number | null; lat: number; lng: number }
): number {
  let score = 100;

  // Bed difference (0 diff = 0 penalty, each bed diff = -10)
  if (subject.beds != null && comp.beds != null) {
    score -= Math.abs(subject.beds - comp.beds) * 10;
  }

  // Bath difference
  if (subject.baths != null && comp.baths != null) {
    score -= Math.abs(subject.baths - comp.baths) * 5;
  }

  // Sqft difference (% based)
  if (subject.buildingSf && comp.buildingSf) {
    const pctDiff = Math.abs(subject.buildingSf - comp.buildingSf) / subject.buildingSf;
    score -= Math.min(30, pctDiff * 100);
  }

  // Year built difference
  if (subject.yearBuilt && comp.yearBuilt) {
    const yearDiff = Math.abs(subject.yearBuilt - comp.yearBuilt);
    score -= Math.min(15, yearDiff * 0.5);
  }

  // Distance penalty
  const dist = haversineDistance(subject.lat, subject.lng, comp.lat, comp.lng);
  score -= Math.min(20, dist * 10);

  return Math.max(0, Math.round(score));
}

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const address = params.get("address");
  const zip = params.get("zip");
  const beds = params.get("beds") ? Number(params.get("beds")) : null;
  const baths = params.get("baths") ? Number(params.get("baths")) : null;
  const sqftMin = params.get("sqftMin") ? Number(params.get("sqftMin")) : null;
  const sqftMax = params.get("sqftMax") ? Number(params.get("sqftMax")) : null;
  const radius = Number(params.get("radius") || "1"); // miles
  const lat = params.get("lat") ? Number(params.get("lat")) : null;
  const lng = params.get("lng") ? Number(params.get("lng")) : null;

  if (!zip && !lat) {
    return NextResponse.json({ error: "zip or lat/lng required" }, { status: 400 });
  }

  try {
    // Try to find the subject property by address
    let subject = null;
    if (address) {
      subject = await prisma.listing.findFirst({
        where: {
          address: { contains: address, mode: "insensitive" },
          ...(zip ? { zip } : {}),
        },
        select: {
          id: true, address: true, city: true, zip: true, lat: true, lng: true,
          priceAmount: true, priceUnit: true, buildingSf: true, lotSizeAcres: true,
          beds: true, baths: true, yearBuilt: true, propertyType: true, propSubType: true,
          listingType: true, status: true, imageUrl: true, createdAt: true,
        },
      });
    }

    // Determine search center
    const centerLat = lat || subject?.lat || 30.267;
    const centerLng = lng || subject?.lng || -97.743;

    // Approximate bounding box for radius
    const latDelta = radius / 69; // ~69 miles per degree latitude
    const lngDelta = radius / (69 * Math.cos((centerLat * Math.PI) / 180));

    // Build comp search criteria
    const where: Record<string, unknown> = {
      searchMode: "residential",
      lat: { gte: centerLat - latDelta, lte: centerLat + latDelta },
      lng: { gte: centerLng - lngDelta, lte: centerLng + lngDelta },
      priceAmount: { not: null },
    };

    if (zip) where.zip = zip;

    if (beds != null) {
      where.beds = { gte: Math.max(1, beds - 1), lte: beds + 1 };
    }

    if (baths != null) {
      where.baths = { gte: Math.max(1, baths - 1), lte: baths + 1 };
    }

    if (sqftMin || sqftMax) {
      where.buildingSf = {};
      if (sqftMin) (where.buildingSf as Record<string, number>).gte = sqftMin * 0.75;
      if (sqftMax) (where.buildingSf as Record<string, number>).lte = sqftMax * 1.25;
    }

    const comps = await prisma.listing.findMany({
      where,
      select: {
        id: true, address: true, city: true, zip: true, lat: true, lng: true,
        priceAmount: true, priceUnit: true, buildingSf: true, lotSizeAcres: true,
        beds: true, baths: true, yearBuilt: true, propertyType: true, propSubType: true,
        listingType: true, status: true, imageUrl: true, createdAt: true,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    // Score and sort comps by similarity to subject
    const subjectRef = subject || {
      beds, baths,
      buildingSf: sqftMin && sqftMax ? (sqftMin + sqftMax) / 2 : sqftMin || sqftMax,
      yearBuilt: null,
      lat: centerLat,
      lng: centerLng,
    };

    const scoredComps: CompListing[] = comps
      .filter((c) => !subject || c.id !== subject.id) // Exclude subject from comps
      .map((c) => {
        const dist = haversineDistance(centerLat, centerLng, c.lat, c.lng);
        const sim = calculateSimilarity(
          subjectRef as { beds: number | null; baths: number | null; buildingSf: number | null; yearBuilt: number | null; lat: number; lng: number },
          c
        );
        return {
          ...c,
          priceAmount: c.priceAmount ? Number(c.priceAmount) : null,
          buildingSf: c.buildingSf ? Number(c.buildingSf) : null,
          lotSizeAcres: c.lotSizeAcres ? Number(c.lotSizeAcres) : null,
          pricePerSqft:
            c.priceAmount && c.buildingSf
              ? Math.round(Number(c.priceAmount) / Number(c.buildingSf))
              : null,
          distance: Math.round(dist * 100) / 100,
          similarityScore: sim,
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 15);

    // Comp stats
    const compPrices = scoredComps
      .filter((c) => c.priceAmount)
      .map((c) => c.priceAmount!);
    compPrices.sort((a, b) => a - b);

    const compPsf = scoredComps
      .filter((c) => c.pricePerSqft)
      .map((c) => c.pricePerSqft!);
    compPsf.sort((a, b) => a - b);

    const stats = {
      compCount: scoredComps.length,
      avgPrice: compPrices.length > 0 ? Math.round(compPrices.reduce((a, b) => a + b, 0) / compPrices.length) : null,
      medianPrice: compPrices.length > 0 ? compPrices[Math.floor(compPrices.length / 2)] : null,
      lowPrice: compPrices.length > 0 ? compPrices[0] : null,
      highPrice: compPrices.length > 0 ? compPrices[compPrices.length - 1] : null,
      avgPricePerSqft: compPsf.length > 0 ? Math.round(compPsf.reduce((a, b) => a + b, 0) / compPsf.length) : null,
      medianPricePerSqft: compPsf.length > 0 ? compPsf[Math.floor(compPsf.length / 2)] : null,
    };

    // Suggested value range
    let suggestedLow: number | null = null;
    let suggestedHigh: number | null = null;
    if (stats.medianPrice && stats.avgPrice) {
      const base = (stats.medianPrice + stats.avgPrice) / 2;
      suggestedLow = Math.round(base * 0.95);
      suggestedHigh = Math.round(base * 1.05);
    }

    return NextResponse.json({
      subject: subject
        ? {
            ...subject,
            priceAmount: subject.priceAmount ? Number(subject.priceAmount) : null,
            buildingSf: subject.buildingSf ? Number(subject.buildingSf) : null,
            pricePerSqft:
              subject.priceAmount && subject.buildingSf
                ? Math.round(Number(subject.priceAmount) / Number(subject.buildingSf))
                : null,
          }
        : null,
      comps: scoredComps,
      stats,
      suggestedRange: { low: suggestedLow, high: suggestedHigh },
    });
  } catch (e) {
    console.error("[cma] Error:", e);
    return NextResponse.json({ error: "Failed to run CMA" }, { status: 500 });
  }
}
