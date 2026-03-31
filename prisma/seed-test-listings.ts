import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const TEST_LISTINGS = [
  // === AUSTIN ===
  {
    address: "401 Congress Ave",
    city: "Austin", state: "TX", zip: "78701",
    lat: 30.2672, lng: -97.7431,
    market: "austin", propertyType: "Office", listingType: "Lease",
    buildingSf: 45000, priceAmount: 42, priceUnit: "SF/YR",
    yearBuilt: 2008, brokerName: "Sarah Mitchell", brokerCompany: "CBRE",
    description: "Class A office in the heart of downtown Austin with panoramic views of Lady Bird Lake. Recently renovated lobby and common areas.",
  },
  {
    address: "2400 E Cesar Chavez St",
    city: "Austin", state: "TX", zip: "78702",
    lat: 30.2555, lng: -97.7225,
    market: "austin", propertyType: "Retail", listingType: "Lease",
    buildingSf: 3200, priceAmount: 35, priceUnit: "SF/YR",
    yearBuilt: 1965, brokerName: "Mike Torres", brokerCompany: "JLL",
    description: "Prime retail space on East Cesar Chavez in booming East Austin. High foot traffic, surrounded by restaurants and galleries.",
  },
  {
    address: "9800 N Lamar Blvd",
    city: "Austin", state: "TX", zip: "78753",
    lat: 30.3722, lng: -97.6928,
    market: "austin", propertyType: "Industrial", listingType: "Sale",
    buildingSf: 28000, lotSizeAcres: 2.1, priceAmount: 3200000, priceUnit: "Total",
    yearBuilt: 1998, brokerName: "James Whitfield", brokerCompany: "Cushman & Wakefield",
    description: "Flex industrial warehouse with office build-out near N Lamar and Braker. Clear height 24ft, 3 dock-high doors.",
  },
  {
    address: "1100 S 1st St",
    city: "Austin", state: "TX", zip: "78704",
    lat: 30.2490, lng: -97.7545,
    market: "austin", propertyType: "Mixed Use", listingType: "Sale",
    buildingSf: 12000, lotSizeAcres: 0.45, priceAmount: 4500000, priceUnit: "Total",
    yearBuilt: 2019, brokerName: "Rachel Kim", brokerCompany: "Marcus & Millichap",
    description: "Mixed-use building on South 1st with ground-floor retail and 8 residential units above. Strong rental history in SoCo area.",
  },
  {
    address: "4408 Metric Blvd",
    city: "Austin", state: "TX", zip: "78745",
    lat: 30.3510, lng: -97.7175,
    market: "austin", propertyType: "Office", listingType: "Lease",
    buildingSf: 8500, priceAmount: 28, priceUnit: "SF/YR",
    yearBuilt: 2001, brokerName: "David Chen", brokerCompany: "Transwestern",
    description: "Professional office space near the Domain. Open floor plan, fiber internet, ample parking.",
  },
  {
    address: "7701 E Ben White Blvd",
    city: "Austin", state: "TX", zip: "78741",
    lat: 30.2210, lng: -97.7020,
    market: "austin", propertyType: "Industrial", listingType: "Lease",
    buildingSf: 52000, priceAmount: 12, priceUnit: "SF/YR",
    yearBuilt: 2015, brokerName: "Tom Bradley", brokerCompany: "CBRE",
    description: "Distribution warehouse near SH-71 and I-35 interchange. Cross-dock configuration, ESFR sprinklers, trailer parking.",
  },
  {
    address: "3500 Jefferson St",
    city: "Austin", state: "TX", zip: "78731",
    lat: 30.3065, lng: -97.7500,
    market: "austin", propertyType: "Multifamily", listingType: "Sale",
    buildingSf: 18000, lotSizeAcres: 0.8, priceAmount: 6800000, priceUnit: "Total",
    yearBuilt: 2012, brokerName: "Linda Foster", brokerCompany: "Berkadia",
    description: "24-unit apartment complex near Tarrytown. Fully occupied, recent exterior renovations. Strong NOI.",
  },
  {
    address: "13945 US-183 Hwy",
    city: "Austin", state: "TX", zip: "78717",
    lat: 30.4800, lng: -97.7910,
    market: "austin", propertyType: "Land", listingType: "Sale",
    lotSizeAcres: 15.3, priceAmount: 8900000, priceUnit: "Total",
    brokerName: "Greg Hernandez", brokerCompany: "HFF",
    description: "Prime development land along US-183 in Cedar Park corridor. Zoned for mixed-use, utilities available at site.",
  },
  {
    address: "600 W 6th St",
    city: "Austin", state: "TX", zip: "78701",
    lat: 30.2705, lng: -97.7490,
    market: "austin", propertyType: "Retail", listingType: "Lease",
    buildingSf: 5500, priceAmount: 55, priceUnit: "SF/YR",
    yearBuilt: 2017, brokerName: "Amanda Ross", brokerCompany: "Endeavor",
    description: "Restaurant/bar space on West 6th Street. Fully built-out kitchen, patio seating, high visibility corner location.",
  },
  {
    address: "11200 Lakeline Mall Dr",
    city: "Austin", state: "TX", zip: "78717",
    lat: 30.4730, lng: -97.7920,
    market: "austin", propertyType: "Retail", listingType: "Sale",
    buildingSf: 22000, lotSizeAcres: 1.5, priceAmount: 5200000, priceUnit: "Total",
    yearBuilt: 2005, brokerName: "Paul Wagner", brokerCompany: "Weitzman",
    description: "Multi-tenant retail center near Lakeline Mall. 92% occupied with NNN leases. Strong suburban traffic counts.",
  },
  // === DFW ===
  {
    address: "2100 McKinney Ave",
    city: "Dallas", state: "TX", zip: "75201",
    lat: 32.7935, lng: -96.8015,
    market: "dfw", propertyType: "Office", listingType: "Lease",
    buildingSf: 65000, priceAmount: 38, priceUnit: "SF/YR",
    yearBuilt: 2016, brokerName: "Kevin Park", brokerCompany: "CBRE",
    description: "Class A office tower in Uptown Dallas. Floor-to-ceiling windows, on-site fitness center, walking distance to Katy Trail.",
  },
  {
    address: "500 Commerce St",
    city: "Dallas", state: "TX", zip: "75202",
    lat: 32.7810, lng: -96.7985,
    market: "dfw", propertyType: "Office", listingType: "Sale",
    buildingSf: 120000, priceAmount: 28000000, priceUnit: "Total",
    yearBuilt: 1985, brokerName: "Jennifer Walsh", brokerCompany: "Newmark",
    description: "Historic office building in downtown Dallas CBD. Recently updated HVAC and elevators. Value-add opportunity.",
  },
  {
    address: "4200 S Freeway",
    city: "Fort Worth", state: "TX", zip: "76115",
    lat: 32.7050, lng: -97.3245,
    market: "dfw", propertyType: "Industrial", listingType: "Lease",
    buildingSf: 85000, priceAmount: 8.50, priceUnit: "SF/YR",
    yearBuilt: 2020, brokerName: "Brian Keller", brokerCompany: "Prologis",
    description: "Modern distribution facility south of downtown Fort Worth. 32ft clear height, 50x50 column spacing, LED lighting.",
  },
  {
    address: "3000 Grapevine Mills Pkwy",
    city: "Grapevine", state: "TX", zip: "76051",
    lat: 32.9345, lng: -97.0565,
    market: "dfw", propertyType: "Retail", listingType: "Lease",
    buildingSf: 4800, priceAmount: 30, priceUnit: "SF/YR",
    yearBuilt: 2010, brokerName: "Nicole Adams", brokerCompany: "JLL",
    description: "Inline retail space near Grapevine Mills. Co-tenants include national brands. High traffic location near DFW Airport.",
  },
  {
    address: "1700 Pacific Ave",
    city: "Dallas", state: "TX", zip: "75201",
    lat: 32.7870, lng: -96.7990,
    market: "dfw", propertyType: "Multifamily", listingType: "Sale",
    buildingSf: 95000, lotSizeAcres: 1.2, priceAmount: 42000000, priceUnit: "Total",
    yearBuilt: 2022, brokerName: "Steven Clarke", brokerCompany: "Berkadia",
    description: "Luxury high-rise apartments in Dallas Arts District. 180 units, resort-style amenities, 95% occupancy.",
  },
  {
    address: "8700 John W Carpenter Fwy",
    city: "Dallas", state: "TX", zip: "75247",
    lat: 32.8125, lng: -96.8790,
    market: "dfw", propertyType: "Industrial", listingType: "Sale",
    buildingSf: 150000, lotSizeAcres: 8.5, priceAmount: 15500000, priceUnit: "Total",
    yearBuilt: 2003, brokerName: "Mark Sullivan", brokerCompany: "Cushman & Wakefield",
    description: "Large industrial complex near I-35E/I-635 interchange. Includes 20,000 SF office build-out. Rail spur access.",
  },
  {
    address: "1205 W Magnolia Ave",
    city: "Fort Worth", state: "TX", zip: "76104",
    lat: 32.7320, lng: -97.3405,
    market: "dfw", propertyType: "Retail", listingType: "Sale",
    buildingSf: 6200, lotSizeAcres: 0.3, priceAmount: 1850000, priceUnit: "Total",
    yearBuilt: 1940, brokerName: "Ashley Martinez", brokerCompany: "Younger Partners",
    description: "Character retail building on Magnolia Ave in Fort Worth's Near Southside. Ideal for restaurant, boutique, or gallery.",
  },
  {
    address: "5100 Belt Line Rd",
    city: "Addison", state: "TX", zip: "75254",
    lat: 32.9510, lng: -96.8315,
    market: "dfw", propertyType: "Office", listingType: "Lease",
    buildingSf: 15000, priceAmount: 24, priceUnit: "SF/YR",
    yearBuilt: 1999, brokerName: "Daniel Lee", brokerCompany: "Avison Young",
    description: "Professional office space in Addison near the Tollway. Recently remodeled, covered parking, easy access to restaurants.",
  },
  {
    address: "2500 E Abram St",
    city: "Arlington", state: "TX", zip: "76010",
    lat: 32.7360, lng: -97.0885,
    market: "dfw", propertyType: "Land", listingType: "Sale",
    lotSizeAcres: 22.0, priceAmount: 12000000, priceUnit: "Total",
    brokerName: "Robert Nguyen", brokerCompany: "Colliers",
    description: "Development site between AT&T Stadium and Globe Life Field. Entitled for mixed-use. Once-in-a-generation opportunity.",
  },
  {
    address: "4901 W Plano Pkwy",
    city: "Plano", state: "TX", zip: "75093",
    lat: 33.0195, lng: -96.7580,
    market: "dfw", propertyType: "Office", listingType: "Sublease",
    buildingSf: 35000, priceAmount: 18, priceUnit: "SF/YR",
    yearBuilt: 2014, brokerName: "Karen Thompson", brokerCompany: "Stream Realty",
    description: "Corporate sublease in Legacy West area. Fully furnished, data/telecom infrastructure in place. Available immediately.",
  },
];

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  // Get the crexi source to use as the "source" for test data
  let source = await prisma.listingSource.findUnique({ where: { slug: "crexi" } });
  if (!source) {
    source = await prisma.listingSource.create({
      data: { name: "Test Data", slug: "test-data" },
    });
  }

  let created = 0;
  for (const l of TEST_LISTINGS) {
    const dedupeKey = [
      l.address.toLowerCase().replace(/\s+/g, " ").trim(),
      (l.buildingSf ?? 0).toString(),
      l.propertyType.toLowerCase(),
      (l.brokerName ?? "unknown").toLowerCase(),
    ].join("|");

    const externalId = `test-${dedupeKey.replace(/[^a-z0-9]/g, "-").slice(0, 60)}`;

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
        buildingSf: l.buildingSf,
        lotSizeAcres: l.lotSizeAcres,
        priceAmount: l.priceAmount,
        priceUnit: l.priceUnit,
        yearBuilt: l.yearBuilt,
        brokerName: l.brokerName,
        brokerCompany: l.brokerCompany,
        description: l.description,
        dedupeKey,
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
        buildingSf: l.buildingSf,
        description: l.description,
        brokerName: l.brokerName,
      },
      update: {},
    });

    created++;
    console.log(`  [${created}] ${l.address}, ${l.city} (${l.propertyType} - ${l.listingType})`);
  }

  console.log(`\nSeeded ${created} test listings (${TEST_LISTINGS.filter(l => l.market === "austin").length} Austin, ${TEST_LISTINGS.filter(l => l.market === "dfw").length} DFW)`);
  await (prisma as unknown as { $disconnect: () => Promise<void> }).$disconnect();
}

main().catch(console.error);
