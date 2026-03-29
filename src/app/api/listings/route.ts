import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseFiltersFromParams, buildListingWhere } from "@/lib/filters";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const filters = parseFiltersFromParams(params);
  const where = buildListingWhere(filters);

  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = Math.min(200, Math.max(1, Number(params.get("limit")) || 50));
  const skip = (page - 1) * limit;

  const format = params.get("format");

  // GeoJSON format for map
  if (format === "geojson") {
    const listings = await prisma.listing.findMany({
      where,
      select: {
        id: true,
        address: true,
        city: true,
        lat: true,
        lng: true,
        propertyType: true,
        listingType: true,
        priceAmount: true,
        priceUnit: true,
        buildingSf: true,
        status: true,
        beds: true,
        baths: true,
        propSubType: true,
        searchMode: true,
      },
      take: 2000,
    });

    const geojson = {
      type: "FeatureCollection" as const,
      features: listings.map((l) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [l.lng, l.lat],
        },
        properties: {
          id: l.id,
          address: l.address,
          city: l.city,
          propertyType: l.propertyType,
          listingType: l.listingType,
          priceAmount: l.priceAmount,
          priceUnit: l.priceUnit,
          buildingSf: l.buildingSf,
          status: l.status,
          beds: l.beds,
          baths: l.baths,
          propSubType: l.propSubType,
          searchMode: l.searchMode,
        },
      })),
    };

    return NextResponse.json(geojson);
  }

  // Standard paginated list
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        variants: {
          include: { source: { select: { name: true, slug: true } } },
        },
      },
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({
    listings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
