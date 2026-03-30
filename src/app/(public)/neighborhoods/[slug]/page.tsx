import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RevealSection } from "@/components/public/RevealSection";

const neighborhoods: Record<
  string,
  { name: string; description: string; zips: string[]; searchQuery: string }
> = {
  downtown: {
    name: "Downtown Austin",
    description:
      "The heart of Austin — high-rises, condos, and walkable urban living. Home to 6th Street, Rainey Street, and the Congress Avenue entertainment district. Downtown offers proximity to everything Austin has to offer.",
    zips: ["78701"],
    searchQuery: "78701",
  },
  "78704": {
    name: "78704 - South Austin",
    description:
      "The soul of Austin. 78704 encompasses South Congress, South Lamar, and Zilker — known for eclectic restaurants, live music, Barton Springs, and a fiercely local vibe. One of Austin's most sought-after zip codes.",
    zips: ["78704"],
    searchQuery: "78704",
  },
  westlake: {
    name: "Westlake",
    description:
      "Austin's premier luxury enclave. Westlake Hills and Rollingwood offer top-rated Eanes ISD schools, hill country views, and large estate homes. Minutes from downtown with a suburban feel.",
    zips: ["78746", "78733"],
    searchQuery: "Westlake",
  },
  "east-side": {
    name: "East Austin",
    description:
      "Austin's fastest-growing and most dynamic neighborhood. East Austin blends historic character with new development — craft breweries, art galleries, food trucks, and a thriving creative community.",
    zips: ["78702", "78721"],
    searchQuery: "78702",
  },
  riverside: {
    name: "Riverside",
    description:
      "Southeast Austin's rising star. With new development, proximity to downtown, Lady Bird Lake access, and improving amenities, Riverside offers strong value and investment potential.",
    zips: ["78741"],
    searchQuery: "Riverside Austin",
  },
  "78745": {
    name: "78745 - South Central",
    description:
      "Affordable South Austin living with easy access to downtown, Manchaca Road dining, and neighborhood parks. A popular choice for first-time buyers and families.",
    zips: ["78745"],
    searchQuery: "78745",
  },
  "78731": {
    name: "78731 - Northwest Hills",
    description:
      "Established northwest Austin neighborhood near the Arboretum, Domain, and Anderson Mill. Great schools, mature trees, and family-friendly living.",
    zips: ["78731"],
    searchQuery: "78731",
  },
  "78723": {
    name: "78723 - Windsor Park / Mueller",
    description:
      "Northeast Austin neighborhood anchored by the Mueller development — a master-planned community with parks, retail, and diverse housing. One of Austin's best-kept secrets.",
    zips: ["78723"],
    searchQuery: "78723",
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hood = neighborhoods[slug];
  if (!hood) return { title: "Neighborhood Not Found | Shapiro Group" };

  return {
    title: `${hood.name} Homes for Sale | Shapiro Group`,
    description: `Search homes for sale in ${hood.name}. SuperSearch finds more listings than Zillow. ${hood.description.slice(0, 120)}...`,
  };
}

export function generateStaticParams() {
  return Object.keys(neighborhoods).map((slug) => ({ slug }));
}

export default async function NeighborhoodPage({ params }: Props) {
  const { slug } = await params;
  const hood = neighborhoods[slug];

  if (!hood) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-3xl font-semibold mb-4">Neighborhood Not Found</h1>
          <Link href="/neighborhoods" className="text-gold hover:underline">
            View All Neighborhoods
          </Link>
        </div>
      </div>
    );
  }

  // Fetch listing stats for this neighborhood
  let totalListings = 0;
  let avg = "N/A";
  let recentListings: { id: string; address: string; city: string; priceAmount: number | null; priceUnit: string | null; beds: number | null; baths: number | null; buildingSf: number | null; propertyType: string; propSubType: string | null; imageUrl: string | null; listingType: string }[] = [];

  try {
    const [count, avgPrice, listings] = await Promise.all([
      prisma.listing.count({
        where: { status: "active", zip: { in: hood.zips } },
      }),
      prisma.listing.aggregate({
        where: { status: "active", zip: { in: hood.zips }, priceAmount: { not: null } },
        _avg: { priceAmount: true },
      }),
      prisma.listing.findMany({
        where: { status: "active", zip: { in: hood.zips } },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true, address: true, city: true, priceAmount: true, priceUnit: true,
          beds: true, baths: true, buildingSf: true, propertyType: true,
          propSubType: true, imageUrl: true, listingType: true,
        },
      }),
    ]);

    totalListings = count;
    avg = avgPrice._avg.priceAmount
      ? `$${Math.round(Number(avgPrice._avg.priceAmount) / 1000)}K`
      : "N/A";
    recentListings = listings.map((l) => ({
      ...l,
      priceAmount: l.priceAmount ? Number(l.priceAmount) : null,
    }));
  } catch (e) {
    console.error("Failed to fetch neighborhood data:", e);
  }

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Neighborhoods
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            {hood.name}
          </h1>
          <p className="text-white/50 text-lg font-light max-w-2xl mt-6">
            {hood.description}
          </p>
          <div className="mt-10">
            <Link
              href={`/search?searchMode=residential&q=${encodeURIComponent(hood.searchQuery)}`}
              className="btn-primary"
            >
              Search {hood.name} Homes
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-12 border-b border-navy/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-navy">{totalListings}</p>
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mt-2">
                Active Listings
              </p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-navy">{avg}</p>
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mt-2">
                Avg. List Price
              </p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-navy">{hood.zips.join(", ")}</p>
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mt-2">
                ZIP Code{hood.zips.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent listings */}
      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light">
              Latest in <span className="font-semibold">{hood.name}</span>
            </h2>
          </div>

          {recentListings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group bg-white overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-[4/3] bg-navy/5 relative overflow-hidden img-zoom">
                    {listing.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.imageUrl}
                        alt={listing.address}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-navy/5">
                        <span className="text-mid-gray text-sm">No Image</span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1">
                      {listing.listingType}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-lg font-semibold text-navy mb-1">
                      {listing.priceAmount
                        ? `$${listing.priceAmount.toLocaleString()}`
                        : "Contact for Price"}
                    </p>
                    <p className="text-sm text-navy/70 mb-2 truncate">
                      {listing.address}
                    </p>
                    <div className="flex items-center gap-3 text-[12px] text-mid-gray">
                      {listing.beds && <span>{listing.beds} bed</span>}
                      {listing.baths && <span>{listing.baths} bath</span>}
                      {listing.buildingSf && (
                        <span>{listing.buildingSf.toLocaleString()} SF</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-mid-gray mb-4">
                No active listings in the database yet for this area.
              </p>
              <Link
                href={`/search?searchMode=residential&q=${encodeURIComponent(hood.searchQuery)}`}
                className="btn-primary"
              >
                Search with SuperSearch
              </Link>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href={`/search?searchMode=residential&q=${encodeURIComponent(hood.searchQuery)}`}
              className="btn-outline-dark"
            >
              View All {hood.name} Listings
            </Link>
          </div>
        </div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Want to Live in <span className="font-semibold">{hood.name}?</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            Our team knows this area inside and out. Let us help you find
            your perfect home — including off-market opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary">
              Talk to an Expert
            </Link>
            <Link
              href={`/search?searchMode=residential&q=${encodeURIComponent(hood.searchQuery)}`}
              className="btn-outline"
            >
              Search {hood.name}
            </Link>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
