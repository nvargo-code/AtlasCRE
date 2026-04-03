import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RevealSection } from "@/components/public/RevealSection";
import { MarketDashboard } from "@/components/public/MarketDashboard";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Homes for Sale in ${code} | Austin Real Estate | Shapiro Group`,
    description: `Search homes for sale in ZIP code ${code}. See pricing, market trends, and listings. SuperSearch finds more properties than Zillow including off-market homes.`,
  };
}

export const dynamic = "force-dynamic";

export default async function ZipCodePage({ params }: Props) {
  const { code } = await params;

  // Validate ZIP format
  if (!/^\d{5}$/.test(code)) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-navy mb-4">Invalid ZIP Code</h1>
          <Link href="/search" className="text-gold hover:underline">Search All Areas</Link>
        </div>
      </div>
    );
  }

  // Fetch stats
  let totalListings = 0;
  let avgPrice: string = "N/A";
  let medianPrice: string = "N/A";
  let recentListings: {
    id: string; address: string; city: string;
    priceAmount: number | null; beds: number | null;
    baths: number | null; buildingSf: number | null;
    imageUrl: string | null; listingType: string;
  }[] = [];

  try {
    const [count, priceAgg, median, listings] = await Promise.all([
      prisma.listing.count({ where: { status: "active", zip: code } }),
      prisma.listing.aggregate({
        where: { status: "active", zip: code, priceAmount: { not: null } },
        _avg: { priceAmount: true },
      }),
      prisma.listing.findMany({
        where: { status: "active", zip: code, priceAmount: { not: null } },
        orderBy: { priceAmount: "asc" },
        select: { priceAmount: true },
      }),
      prisma.listing.findMany({
        where: { status: "active", zip: code },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true, address: true, city: true, priceAmount: true,
          beds: true, baths: true, buildingSf: true, imageUrl: true, listingType: true,
        },
      }),
    ]);

    totalListings = count;
    avgPrice = priceAgg._avg.priceAmount
      ? `$${Math.round(Number(priceAgg._avg.priceAmount) / 1000)}K`
      : "N/A";

    if (median.length > 0) {
      const mid = median[Math.floor(median.length / 2)];
      medianPrice = mid.priceAmount
        ? Number(mid.priceAmount) >= 1_000_000
          ? `$${(Number(mid.priceAmount) / 1_000_000).toFixed(1)}M`
          : `$${Math.round(Number(mid.priceAmount) / 1000)}K`
        : "N/A";
    }

    recentListings = listings.map((l) => ({
      ...l,
      priceAmount: l.priceAmount ? Number(l.priceAmount) : null,
      buildingSf: l.buildingSf ? Number(l.buildingSf) : null,
    }));
  } catch (e) {
    console.error("ZIP page error:", e);
  }

  // Determine city from listings
  const city = recentListings[0]?.city || "Austin";

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Place",
            name: `${code} — ${city}, TX`,
            address: { "@type": "PostalAddress", postalCode: code, addressLocality: city, addressRegion: "TX" },
          }),
        }}
      />

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <Link href="/neighborhoods" className="text-gold text-[12px] font-semibold tracking-[0.2em] uppercase hover:text-gold-dark mb-4 inline-block">
            &larr; Neighborhoods
          </Link>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Homes in <span className="font-semibold">{code}</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-6">
            {totalListings > 0
              ? `${totalListings} active listings in ${city}, TX ${code}. SuperSearch finds more homes than Zillow.`
              : `Explore homes for sale in ${city}, TX ${code}.`}
          </p>
          <div className="mt-10 flex gap-4">
            <Link href={`/search?searchMode=residential&q=${code}`} className="btn-primary">
              Search {code}
            </Link>
            <Link href="/contact" className="btn-outline">Talk to an Agent</Link>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-white border-b border-navy/10 py-8">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-navy">{totalListings}</p>
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Active Listings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold">{medianPrice}</p>
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Median Price</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{avgPrice}</p>
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Avg Price</p>
            </div>
            <div className="hidden md:block">
              <p className="text-2xl font-bold text-navy">{code}</p>
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">ZIP Code</p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Dashboard */}
      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-10">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">Market Data</p>
            <h2 className="text-3xl font-light">
              {code} <span className="font-semibold">Market Trends</span>
            </h2>
          </div>
          <MarketDashboard zips={[code]} neighborhoodName={`ZIP ${code}`} searchMode="residential" />
        </div>
      </RevealSection>

      {/* Listings Grid */}
      {recentListings.length > 0 && (
        <RevealSection className="section-padding bg-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <h2 className="text-2xl font-light text-navy mb-8 text-center">
              Latest in <span className="font-semibold">{code}</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentListings.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`} className="group bg-white border border-navy/10 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] bg-navy/5 relative overflow-hidden img-zoom">
                    {listing.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.imageUrl} alt={listing.address} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-mid-gray text-sm">No Image</div>
                    )}
                    <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1">
                      {listing.listingType}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-lg font-semibold text-navy group-hover:text-gold transition-colors">
                      {listing.priceAmount ? `$${listing.priceAmount.toLocaleString()}` : "Contact for Price"}
                    </p>
                    <p className="text-sm text-navy/70 truncate">{listing.address}</p>
                    <p className="text-[12px] text-mid-gray">{listing.city}</p>
                    <div className="flex gap-3 mt-2 text-[12px] text-mid-gray">
                      {listing.beds && <span>{listing.beds} bed</span>}
                      {listing.baths && <span>{listing.baths} bath</span>}
                      {listing.buildingSf && <span>{listing.buildingSf.toLocaleString()} SF</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href={`/search?searchMode=residential&q=${code}`} className="btn-outline-dark">
                View All {totalListings} Listings in {code}
              </Link>
            </div>
          </div>
        </RevealSection>
      )}

      {/* CTA */}
      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl font-light text-white mb-6">
            Find Your Home in <span className="font-semibold">{code}</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            SuperSearch aggregates listings from MLS, off-market databases, and broker networks — so you see homes that Zillow misses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/search?searchMode=residential&q=${code}`} className="btn-primary">Search {code}</Link>
            <Link href="/contact" className="btn-outline">Talk to a Local Expert</Link>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
