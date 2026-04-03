import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
// Simple deduplication key for manual entries
import { runPostIngestHooks } from "@/ingestion/post-ingest-hooks";

/**
 * POST /api/portal/add-listing
 *
 * Quick-add a listing manually. For pocket listings, verbal tips, social media finds.
 * Agent/Admin only.
 */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true, email: true },
    });
    if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Agent access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      address, city, zip, lat, lng,
      propertyType, listingType, searchMode,
      priceAmount, beds, baths, buildingSf, lotSizeAcres,
      yearBuilt, description, brokerName, brokerPhone,
      imageUrl, source,
    } = body;

    if (!address || !city) {
      return NextResponse.json({ error: "address and city required" }, { status: 400 });
    }

    // Generate a dedupe key
    const normalizedAddr = address.toLowerCase().trim().replace(/\s+/g, " ");
    const dedupeKey = `${normalizedAddr}|${buildingSf || 0}|${(propertyType || "residential").toLowerCase()}|manual-${Date.now()}`;

    // Create the listing
    const listing = await prisma.listing.create({
      data: {
        address,
        city,
        state: "TX",
        zip: zip || null,
        lat: lat || 30.267,
        lng: lng || -97.743,
        market: "austin",
        propertyType: propertyType || "Residential",
        listingType: listingType || "Sale",
        searchMode: searchMode || "residential",
        priceAmount: priceAmount ? Number(priceAmount) : null,
        beds: beds ? Number(beds) : null,
        baths: baths ? Number(baths) : null,
        buildingSf: buildingSf ? Number(buildingSf) : null,
        lotSizeAcres: lotSizeAcres ? Number(lotSizeAcres) : null,
        yearBuilt: yearBuilt ? Number(yearBuilt) : null,
        description: description || null,
        brokerName: brokerName || user.name || null,
        brokerCompany: "Shapiro Group",
        imageUrl: imageUrl || null,
        dedupeKey,
        status: "active",
      },
    });

    // Create a manual source variant
    let manualSource = await prisma.listingSource.findUnique({ where: { slug: "manual" } });
    if (!manualSource) {
      manualSource = await prisma.listingSource.create({
        data: { name: "Manual Entry", slug: "manual" },
      });
    }

    await prisma.listingVariant.create({
      data: {
        listingId: listing.id,
        sourceId: manualSource.id,
        externalId: `manual-${listing.id}`,
        priceAmount: priceAmount ? Number(priceAmount) : null,
        description: description || null,
        brokerName: brokerName || user.name || null,
        brokerPhone: brokerPhone || null,
        rawData: { source: source || "manual", addedBy: user.email } as Record<string, string>,
      },
    });

    // Run post-ingest hooks (notifications, instant alerts)
    await runPostIngestHooks(listing.id).catch(() => {});

    return NextResponse.json({
      success: true,
      listing: { id: listing.id, address: listing.address },
    });
  } catch (e) {
    console.error("[add-listing] Error:", e);
    return NextResponse.json({ error: "Failed to add listing" }, { status: 500 });
  }
}
