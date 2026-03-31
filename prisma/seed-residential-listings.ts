import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const TEST_LISTINGS = [
  // === AUSTIN RESIDENTIAL ===
  {
    address: "1204 Bouldin Ave",
    city: "Austin", state: "TX", zip: "78704",
    lat: 30.2455, lng: -97.7565,
    market: "austin", propertyType: "single_family", listingType: "sale",
    priceAmount: 875000, priceUnit: "total",
    beds: 3, baths: 2, garageSpaces: 2, stories: 1, yearBuilt: 1952,
    propSubType: "Single Family", searchMode: "residential",
    description: "Charming bungalow in Bouldin Creek. Original hardwood floors, updated kitchen, large backyard with mature oaks.",
  },
  {
    address: "5400 Brodie Ln #1203",
    city: "Austin", state: "TX", zip: "78745",
    lat: 30.2050, lng: -97.8210,
    market: "austin", propertyType: "condo", listingType: "sale",
    priceAmount: 325000, priceUnit: "total",
    beds: 2, baths: 2, garageSpaces: 1, stories: 1, yearBuilt: 2018,
    propSubType: "Condo", searchMode: "residential",
    description: "Modern condo in Shady Hollow. Open floor plan, quartz counters, community pool and fitness center.",
  },
  {
    address: "12009 Metric Blvd",
    city: "Austin", state: "TX", zip: "78758",
    lat: 30.4195, lng: -97.7130,
    market: "austin", propertyType: "townhomes", listingType: "sale",
    priceAmount: 465000, priceUnit: "total",
    beds: 3, baths: 2.5, garageSpaces: 2, stories: 2, yearBuilt: 2021,
    propSubType: "Townhouse", searchMode: "residential",
    description: "New construction townhome near the Domain. Smart home features, rooftop deck, EV charging ready.",
  },
  {
    address: "2601 Live Oak St",
    city: "Austin", state: "TX", zip: "78702",
    lat: 30.2615, lng: -97.7220,
    market: "austin", propertyType: "single_family", listingType: "sale",
    priceAmount: 1250000, priceUnit: "total",
    beds: 4, baths: 3, garageSpaces: 2, stories: 2, yearBuilt: 2020,
    propSubType: "Single Family", searchMode: "residential",
    description: "Stunning modern home in East Austin. Chef's kitchen, primary suite with balcony, walking distance to restaurants and breweries.",
  },
  {
    address: "8900 W Parmer Ln",
    city: "Austin", state: "TX", zip: "78729",
    lat: 30.4210, lng: -97.7620,
    market: "austin", propertyType: "single_family", listingType: "sale",
    priceAmount: 550000, priceUnit: "total",
    beds: 4, baths: 2.5, garageSpaces: 2, stories: 2, yearBuilt: 2015,
    propSubType: "Single Family", searchMode: "residential",
    description: "Family home in McNeil area. Open concept living, large lot, top-rated schools nearby.",
  },
  {
    address: "200 Congress Ave #25F",
    city: "Austin", state: "TX", zip: "78701",
    lat: 30.2650, lng: -97.7435,
    market: "austin", propertyType: "condo", listingType: "sale",
    priceAmount: 1800000, priceUnit: "total",
    beds: 2, baths: 2.5, garageSpaces: 2, stories: 1, yearBuilt: 2010,
    propSubType: "Condo", searchMode: "residential",
    description: "Luxury high-rise condo downtown. Floor-to-ceiling windows, concierge, panoramic views of Lady Bird Lake and Capitol.",
  },
  {
    address: "4505 Duval St",
    city: "Austin", state: "TX", zip: "78751",
    lat: 30.3070, lng: -97.7265,
    market: "austin", propertyType: "multi_family", listingType: "sale",
    priceAmount: 925000, priceUnit: "total",
    beds: 6, baths: 4, garageSpaces: 0, stories: 2, yearBuilt: 1968,
    propSubType: "Multi-Family", searchMode: "residential",
    description: "Duplex in Hyde Park. Both units 3/2, strong rental income, walkable to UT campus.",
  },
  {
    address: "15200 Avery Ranch Blvd",
    city: "Austin", state: "TX", zip: "78717",
    lat: 30.4930, lng: -97.7880,
    market: "austin", propertyType: "single_family", listingType: "sale",
    priceAmount: 725000, priceUnit: "total",
    beds: 5, baths: 3.5, garageSpaces: 3, stories: 2, yearBuilt: 2019,
    propSubType: "Single Family", searchMode: "residential",
    description: "Spacious home in Avery Ranch. Game room, media room, covered patio with outdoor kitchen.",
  },
  {
    address: "2200 S Lakeline Blvd #108",
    city: "Cedar Park", state: "TX", zip: "78613",
    lat: 30.4850, lng: -97.8230,
    market: "austin", propertyType: "condo", listingType: "sale",
    priceAmount: 275000, priceUnit: "total",
    beds: 1, baths: 1, garageSpaces: 1, stories: 1, yearBuilt: 2017,
    propSubType: "Condo", searchMode: "residential",
    description: "Starter condo in Cedar Park. Great investment property or first home. Near H-E-B and 183A toll.",
  },
  {
    address: "1800 Barton Springs Rd",
    city: "Austin", state: "TX", zip: "78704",
    lat: 30.2595, lng: -97.7615,
    market: "austin", propertyType: "single_family", listingType: "sale",
    priceAmount: 2100000, priceUnit: "total",
    beds: 4, baths: 3.5, garageSpaces: 2, stories: 2, yearBuilt: 2022,
    propSubType: "Single Family", searchMode: "residential",
    description: "Custom build near Zilker Park. Wine cellar, heated pool, detached casita. Steps from Barton Springs.",
  },
  // === DFW RESIDENTIAL ===
  {
    address: "3200 Turtle Creek Blvd #1505",
    city: "Dallas", state: "TX", zip: "75219",
    lat: 32.8020, lng: -96.8105,
    market: "dfw", propertyType: "condo", listingType: "sale",
    priceAmount: 1450000, priceUnit: "total",
    beds: 3, baths: 3, garageSpaces: 2, stories: 1, yearBuilt: 2008,
    propSubType: "Condo", searchMode: "residential",
    description: "Luxury condo in Turtle Creek. Wraparound balcony, Italian marble, 24-hour doorman.",
  },
  {
    address: "4200 Armstrong Pkwy",
    city: "Highland Park", state: "TX", zip: "75205",
    lat: 32.8340, lng: -96.7990,
    market: "dfw", propertyType: "single_family", listingType: "sale",
    priceAmount: 3200000, priceUnit: "total",
    beds: 5, baths: 5, garageSpaces: 3, stories: 2, yearBuilt: 2005,
    propSubType: "Single Family", searchMode: "residential",
    description: "Estate home in Highland Park. Pool, guest house, circular drive. Highland Park ISD.",
  },
  {
    address: "800 W Magnolia Ave",
    city: "Fort Worth", state: "TX", zip: "76104",
    lat: 32.7325, lng: -97.3355,
    market: "dfw", propertyType: "townhomes", listingType: "sale",
    priceAmount: 485000, priceUnit: "total",
    beds: 3, baths: 2.5, garageSpaces: 2, stories: 3, yearBuilt: 2023,
    propSubType: "Townhouse", searchMode: "residential",
    description: "New townhome on Magnolia Ave. Rooftop terrace, walkable to restaurants, near Medical District.",
  },
  {
    address: "6700 Preston Rd #401",
    city: "Plano", state: "TX", zip: "75024",
    lat: 33.0560, lng: -96.8025,
    market: "dfw", propertyType: "condo", listingType: "sale",
    priceAmount: 390000, priceUnit: "total",
    beds: 2, baths: 2, garageSpaces: 2, stories: 1, yearBuilt: 2020,
    propSubType: "Condo", searchMode: "residential",
    description: "Resort-style condo in West Plano. Upgraded finishes, Legacy West nearby, excellent Plano ISD schools.",
  },
  {
    address: "1009 Dragon St",
    city: "Dallas", state: "TX", zip: "75207",
    lat: 32.7890, lng: -96.8125,
    market: "dfw", propertyType: "single_family", listingType: "sale",
    priceAmount: 1150000, priceUnit: "total",
    beds: 3, baths: 3.5, garageSpaces: 2, stories: 3, yearBuilt: 2019,
    propSubType: "Single Family", searchMode: "residential",
    description: "Modern home in Design District. Rooftop deck with skyline views, walking distance to galleries and restaurants.",
  },
  {
    address: "5500 Camp Bowie Blvd",
    city: "Fort Worth", state: "TX", zip: "76107",
    lat: 32.7370, lng: -97.3830,
    market: "dfw", propertyType: "single_family", listingType: "sale",
    priceAmount: 650000, priceUnit: "total",
    beds: 3, baths: 2, garageSpaces: 2, stories: 1, yearBuilt: 1955,
    propSubType: "Single Family", searchMode: "residential",
    description: "Mid-century ranch in Ridglea Hills. Renovated kitchen and baths, original stone fireplace, large lot.",
  },
  {
    address: "2300 Wolf St #18B",
    city: "Dallas", state: "TX", zip: "75201",
    lat: 32.7930, lng: -96.8045,
    market: "dfw", propertyType: "condo", listingType: "sale",
    priceAmount: 675000, priceUnit: "total",
    beds: 2, baths: 2, garageSpaces: 1, stories: 1, yearBuilt: 2016,
    propSubType: "Condo", searchMode: "residential",
    description: "Uptown Dallas condo. Hardwood floors, custom closets, rooftop pool with downtown views.",
  },
  {
    address: "1500 S University Dr",
    city: "Fort Worth", state: "TX", zip: "76107",
    lat: 32.7340, lng: -97.3600,
    market: "dfw", propertyType: "multi_family", listingType: "sale",
    priceAmount: 1100000, priceUnit: "total",
    beds: 8, baths: 6, garageSpaces: 4, stories: 2, yearBuilt: 1975,
    propSubType: "Multi-Family", searchMode: "residential",
    description: "Fourplex near TCU. All units leased, strong NOI. Walk to campus and Berry Street shops.",
  },
  {
    address: "9100 Sunnyvale Rd",
    city: "Frisco", state: "TX", zip: "75035",
    lat: 33.1505, lng: -96.8240,
    market: "dfw", propertyType: "single_family", listingType: "sale",
    priceAmount: 595000, priceUnit: "total",
    beds: 4, baths: 3, garageSpaces: 2, stories: 2, yearBuilt: 2022,
    propSubType: "Single Family", searchMode: "residential",
    description: "New home in Frisco. Open concept, study, covered patio. Near PGA headquarters and Frisco ISD.",
  },
  {
    address: "4100 Lemmon Ave #208",
    city: "Dallas", state: "TX", zip: "75219",
    lat: 32.8110, lng: -96.8140,
    market: "dfw", propertyType: "condo", listingType: "sale",
    priceAmount: 295000, priceUnit: "total",
    beds: 1, baths: 1, garageSpaces: 1, stories: 1, yearBuilt: 2015,
    propSubType: "Condo", searchMode: "residential",
    description: "Oak Lawn condo. Updated unit with skyline views, walkable to Katy Trail and Knox-Henderson.",
  },
];

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  // Use realtor as the source for test residential data
  let source = await prisma.listingSource.findUnique({ where: { slug: "realtor" } });
  if (!source) {
    source = await prisma.listingSource.create({
      data: { name: "Realtor.com", slug: "realtor" },
    });
  }

  let created = 0;
  for (const l of TEST_LISTINGS) {
    const dedupeKey = [
      l.address.toLowerCase().replace(/\s+/g, " ").trim(),
      (l.beds ?? 0).toString(),
      l.propertyType.toLowerCase(),
      "residential",
    ].join("|");

    const externalId = `test-res-${dedupeKey.replace(/[^a-z0-9]/g, "-").slice(0, 60)}`;

    const listing = await prisma.listing.upsert({
      where: { dedupeKey },
      create: {
        address: l.address,
        city: l.city,
        state: l.state,
        zip: l.zip,
        lat: l.lat,
        lng: l.lng,
        market: l.market,
        propertyType: l.propertyType,
        listingType: l.listingType,
        priceAmount: l.priceAmount,
        priceUnit: l.priceUnit,
        yearBuilt: l.yearBuilt,
        description: l.description,
        dedupeKey,
        beds: l.beds,
        baths: l.baths,
        garageSpaces: l.garageSpaces,
        stories: l.stories,
        propSubType: l.propSubType,
        searchMode: l.searchMode,
      },
      update: {},
    });

    await prisma.listingVariant.upsert({
      where: {
        sourceId_externalId: {
          sourceId: source.id,
          externalId,
        },
      },
      create: {
        listingId: listing.id,
        sourceId: source.id,
        externalId,
        priceAmount: l.priceAmount,
        priceUnit: l.priceUnit,
        description: l.description,
      },
      update: {},
    });

    created++;
    console.log(`  [${created}] ${l.address}, ${l.city} (${l.propSubType} - ${l.beds}bd/${l.baths}ba)`);
  }

  console.log(`\nSeeded ${created} residential listings (${TEST_LISTINGS.filter(l => l.market === "austin").length} Austin, ${TEST_LISTINGS.filter(l => l.market === "dfw").length} DFW)`);
  await (prisma as unknown as { $disconnect: () => Promise<void> }).$disconnect();
}

main().catch(console.error);
