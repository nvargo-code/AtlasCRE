import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deduplicateListings } from "@/ingestion/dedupe";
import { NormalizedListing } from "@/ingestion/types";

const SCRAPER_URL = process.env.SCRAPER_SERVICE_URL ?? "http://134.209.172.184:3333";
const SCRAPER_SECRET = process.env.SCRAPER_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await req.json();
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  // Fetch completed listings from scraper
  const res = await fetch(`${SCRAPER_URL}/scrape/aln/job/${jobId}/results`, {
    headers: { Authorization: `Bearer ${SCRAPER_SECRET}` },
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);

  if (!res?.ok) {
    return NextResponse.json({ error: "Failed to fetch job results" }, { status: 502 });
  }

  const listings: NormalizedListing[] = await res.json();

  // Upsert into DB (same logic as runner.ts)
  let listingsUpserted = 0;
  let variantsCreated = 0;

  // Ensure source exists
  await prisma.listingSource.upsert({
    where: { slug: "aln" },
    create: { name: "Austin Luxury Network", slug: "aln" },
    update: {},
  });

  const groups = deduplicateListings(listings);

  for (const [dedupeKey, variants] of groups) {
    const master = variants[0];

    const listing = await prisma.listing.upsert({
      where: { dedupeKey },
      create: {
        address: master.address,
        city: master.city,
        state: master.state,
        zip: master.zip,
        lat: master.lat,
        lng: master.lng,
        market: master.market,
        propertyType: master.propertyType,
        listingType: master.listingType,
        buildingSf: master.buildingSf,
        lotSizeAcres: master.lotSizeAcres,
        priceAmount: master.priceAmount,
        priceUnit: master.priceUnit,
        yearBuilt: master.yearBuilt,
        brokerName: master.brokerName,
        brokerCompany: master.brokerCompany,
        description: master.description,
        imageUrl: master.imageUrl,
        dedupeKey,
      },
      update: {
        priceAmount: master.priceAmount,
        priceUnit: master.priceUnit,
        status: "active",
        updatedAt: new Date(),
      },
    });
    listingsUpserted++;

    for (const v of variants) {
      const source = await prisma.listingSource.findUnique({ where: { slug: v.sourceSlug } });
      if (!source) continue;

      await prisma.listingVariant.upsert({
        where: { sourceId_externalId: { sourceId: source.id, externalId: v.externalId } },
        create: {
          listingId: listing.id,
          sourceId: source.id,
          externalId: v.externalId,
          sourceUrl: v.sourceUrl,
          priceAmount: v.priceAmount,
          priceUnit: v.priceUnit,
          buildingSf: v.buildingSf,
          description: v.description,
          brokerName: v.brokerName,
          brokerPhone: v.brokerPhone,
          brokerEmail: v.brokerEmail,
          imageUrl: v.imageUrl,
          rawData: v.rawData as Record<string, string | number | boolean | null>,
        },
        update: {
          priceAmount: v.priceAmount,
          priceUnit: v.priceUnit,
          description: v.description,
          fetchedAt: new Date(),
        },
      });
      variantsCreated++;
    }
  }

  // Update source last run status
  await prisma.listingSource.update({
    where: { slug: "aln" },
    data: { lastRunAt: new Date(), lastRunStatus: "success" },
  });

  return NextResponse.json({
    providersRun: 1,
    listingsFetched: listings.length,
    listingsUpserted,
    variantsCreated,
    errors: [],
  });
}
