import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/autocomplete?q=west&limit=8
 *
 * Returns autocomplete suggestions for the search bar:
 * - Matching addresses
 * - Matching cities
 * - Matching ZIP codes
 * - Matching neighborhoods (from static data)
 */

export const dynamic = "force-dynamic";

const NEIGHBORHOODS = [
  { name: "Downtown Austin", slug: "downtown", zip: "78701" },
  { name: "South Austin (78704)", slug: "78704", zip: "78704" },
  { name: "Westlake", slug: "westlake", zip: "78746" },
  { name: "East Austin", slug: "east-side", zip: "78702" },
  { name: "Riverside", slug: "riverside", zip: "78741" },
  { name: "Northwest Hills", slug: "78731", zip: "78731" },
  { name: "Windsor Park / Mueller", slug: "78723", zip: "78723" },
  { name: "South Central (78745)", slug: "78745", zip: "78745" },
];

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || "8"), 15);

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions: { type: string; text: string; subtext?: string; href?: string }[] = [];

    // Neighborhood matches
    const hoodMatches = NEIGHBORHOODS.filter(
      (h) => h.name.toLowerCase().includes(q.toLowerCase()) || h.zip.includes(q)
    );
    for (const h of hoodMatches.slice(0, 3)) {
      suggestions.push({
        type: "neighborhood",
        text: h.name,
        subtext: `ZIP ${h.zip}`,
        href: `/neighborhoods/${h.slug}`,
      });
    }

    // ZIP code matches
    if (/^\d{2,5}$/.test(q)) {
      const zips = await prisma.listing.findMany({
        where: { zip: { startsWith: q }, status: "active" },
        select: { zip: true },
        distinct: ["zip"],
        take: 5,
      });
      for (const z of zips) {
        if (z.zip && !suggestions.some((s) => s.text === z.zip)) {
          const count = await prisma.listing.count({ where: { zip: z.zip, status: "active" } });
          suggestions.push({
            type: "zip",
            text: z.zip,
            subtext: `${count} listings`,
            href: `/zip/${z.zip}`,
          });
        }
      }
    }

    // City matches
    const cities = await prisma.listing.findMany({
      where: { city: { contains: q, mode: "insensitive" }, status: "active" },
      select: { city: true },
      distinct: ["city"],
      take: 3,
    });
    for (const c of cities) {
      if (!suggestions.some((s) => s.text === c.city)) {
        suggestions.push({
          type: "city",
          text: c.city,
          subtext: "City",
        });
      }
    }

    // Address matches
    const addresses = await prisma.listing.findMany({
      where: { address: { contains: q, mode: "insensitive" }, status: "active" },
      select: { id: true, address: true, city: true, priceAmount: true },
      take: 4,
      orderBy: { updatedAt: "desc" },
    });
    for (const a of addresses) {
      const price = a.priceAmount
        ? Number(a.priceAmount) >= 1_000_000
          ? `$${(Number(a.priceAmount) / 1_000_000).toFixed(1)}M`
          : `$${Math.round(Number(a.priceAmount) / 1000)}K`
        : "";
      suggestions.push({
        type: "address",
        text: a.address,
        subtext: `${a.city} ${price}`,
        href: `/listings/${a.id}`,
      });
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, limit) });
  } catch (e) {
    console.error("[autocomplete] Error:", e);
    return NextResponse.json({ suggestions: [] });
  }
}
