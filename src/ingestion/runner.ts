import { prisma } from "@/lib/prisma";
import { ListingProvider, NormalizedListing } from "./types";
import { deduplicateListings, generateDedupeKey } from "./dedupe";
import { realtorProvider } from "./providers/realtor";
import { loopnetProvider } from "./providers/loopnet";
import { crexiProvider } from "./providers/crexi";
import { davisonvogelProvider } from "./providers/davisonvogel";
import { youngerpartnersProvider } from "./providers/youngerpartners";
import { alnProvider } from "./providers/aln";

const ALL_PROVIDERS: ListingProvider[] = [
  crexiProvider,
  realtorProvider,
  alnProvider,
  loopnetProvider,
  davisonvogelProvider,
  youngerpartnersProvider,
];

const MARKETS = ["austin", "dfw"] as const;

interface IngestionOptions {
  provider?: string;
  market?: string;
}

interface IngestionResult {
  providersRun: number;
  listingsFetched: number;
  listingsUpserted: number;
  variantsCreated: number;
  errors: string[];
}

export async function runIngestion(options: IngestionOptions): Promise<IngestionResult> {
  const result: IngestionResult = {
    providersRun: 0,
    listingsFetched: 0,
    listingsUpserted: 0,
    variantsCreated: 0,
    errors: [],
  };

  const providers = options.provider
    ? ALL_PROVIDERS.filter((p) => p.slug === options.provider)
    : ALL_PROVIDERS;

  const markets = options.market
    ? MARKETS.filter((m) => m === options.market)
    : [...MARKETS];

  // Collect all normalized listings across providers and markets
  const allListings: NormalizedListing[] = [];

  for (const provider of providers) {
    // Ensure source exists in DB and check enabled flag
    const source = await prisma.listingSource.upsert({
      where: { slug: provider.slug },
      create: { name: provider.name, slug: provider.slug },
      update: {},
    });

    if (!source.enabled) {
      console.log(`[runner] Skipping disabled provider: ${provider.slug}`);
      continue;
    }

    for (const market of markets) {
      try {
        const listings = await provider.fetchListings(market);
        allListings.push(...listings);
        result.listingsFetched += listings.length;

        await prisma.listingSource.update({
          where: { slug: provider.slug },
          data: { lastRunAt: new Date(), lastRunStatus: "success" },
        });
      } catch (err) {
        const msg = `[${provider.slug}/${market}] ${err instanceof Error ? err.message : "Unknown error"}`;
        result.errors.push(msg);
        console.error(msg);

        await prisma.listingSource.update({
          where: { slug: provider.slug },
          data: { lastRunAt: new Date(), lastRunStatus: `error: ${msg}` },
        });
      }
    }
    result.providersRun++;
  }

  // Deduplicate and upsert
  const groups = deduplicateListings(allListings);

  for (const [dedupeKey, variants] of groups) {
    const master = variants[0];

    // Upsert master listing
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
        beds: master.beds,
        baths: master.baths,
        garageSpaces: master.garageSpaces,
        stories: master.stories,
        propSubType: master.propSubType,
        searchMode: master.searchMode ?? "commercial",
      },
      update: {
        priceAmount: master.priceAmount,
        priceUnit: master.priceUnit,
        status: "active",
        updatedAt: new Date(),
        beds: master.beds,
        baths: master.baths,
        garageSpaces: master.garageSpaces,
        stories: master.stories,
        propSubType: master.propSubType,
        searchMode: master.searchMode ?? "commercial",
      },
    });
    result.listingsUpserted++;

    // Upsert variants
    for (const v of variants) {
      const source = await prisma.listingSource.findUnique({
        where: { slug: v.sourceSlug },
      });
      if (!source) continue;

      await prisma.listingVariant.upsert({
        where: {
          sourceId_externalId: {
            sourceId: source.id,
            externalId: v.externalId,
          },
        },
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
      result.variantsCreated++;
    }
  }

  return result;
}
