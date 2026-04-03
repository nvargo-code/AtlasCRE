import Link from "next/link";
import Image from "next/image";
import { HeroSearch } from "@/components/public/HeroSearch";
import { StatsCounter } from "@/components/public/StatsCounter";
import { TestimonialSlider } from "@/components/public/TestimonialSlider";
import { RevealSection } from "@/components/public/RevealSection";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featuredListings: { id: string; address: string; city: string; priceAmount: number | null; priceUnit: string | null; beds: number | null; baths: number | null; buildingSf: number | null; propertyType: string; propSubType: string | null; imageUrl: string | null; listingType: string; searchMode: string }[] = [];
  let totalListings = 0;

  try {
    const raw = await prisma.listing.findMany({
      where: { status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true, address: true, city: true, priceAmount: true, priceUnit: true,
        beds: true, baths: true, buildingSf: true, propertyType: true,
        propSubType: true, imageUrl: true, listingType: true, searchMode: true,
      },
    });
    featuredListings = raw.map((l) => ({ ...l, priceAmount: l.priceAmount ? Number(l.priceAmount) : null }));
    totalListings = await prisma.listing.count({ where: { status: "active" } });
  } catch (e) {
    console.error("Failed to fetch featured listings:", e);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Shapiro Group",
    alternateName: "Shapiro Real Estate Group",
    description: "Austin's most comprehensive property search. SuperSearch finds more listings than Zillow.",
    url: "https://shapirogroup.co",
    telephone: "+1-512-537-6023",
    email: "team@shapirogroup.co",
    address: {
      "@type": "PostalAddress",
      streetAddress: "2028 Ben White Blvd, Suite 240-7070",
      addressLocality: "Austin",
      addressRegion: "TX",
      postalCode: "78741",
      addressCountry: "US",
    },
    areaServed: { "@type": "City", name: "Austin", containedInPlace: { "@type": "State", name: "Texas" } },
    parentOrganization: { "@type": "RealEstateAgent", name: "eXp Realty" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-end pb-24 md:pb-32">
        <div className="absolute inset-0 bg-navy overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-navy" />
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[800px] h-[400px] bg-gold/3 rounded-full blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(201,169,110,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,110,0.3) 1px, transparent 1px)`,
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 w-full">
          <div className="max-w-3xl">
            <p className="text-gold text-[13px] font-semibold tracking-[0.25em] uppercase mb-6 animate-fade-in-up">
              Austin Real Estate. Redefined.
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white leading-[1.1] mb-6 animate-fade-in-up-delay-1">
              Every Listing.<br />
              <span className="font-semibold">Every Advantage.</span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl font-light max-w-xl mb-10 animate-fade-in-up-delay-2">
              Zillow shows you some of the market. We built SuperSearch to show you all of it —
              including the off-market, pocket, and broker-exclusive properties that never hit consumer portals.
            </p>
          </div>

          <div className="animate-fade-in-up-delay-3">
            <HeroSearch />
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="text-white/50 text-[10px] tracking-[0.2em] uppercase">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </section>

      {/* ─── SUPERSEARCH ADVANTAGE ─── */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
                Atlas Intelligence
              </p>
              <h2 className="text-3xl md:text-5xl font-light leading-tight mb-6">
                The Listings Zillow<br />
                <span className="font-semibold">Doesn&apos;t Have</span>
              </h2>
              <p className="text-mid-gray text-base leading-relaxed mb-4 max-w-lg">
                Every major portal pulls from the same MLS feed. That&apos;s table stakes.
                SuperSearch goes further — aggregating off-market inventories, luxury
                network exclusives, pocket listings whispered between brokers, and
                properties that sell before they ever hit a public website.
              </p>
              <p className="text-navy text-base font-medium mb-8 max-w-lg">
                The result: you see every property. Not most. Every.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/search" className="btn-primary">
                  Search Now
                </Link>
                <Link href="/buy" className="btn-outline-dark">
                  How It Works
                </Link>
              </div>
            </div>

            <div className="bg-warm-gray rounded-sm p-8 md:p-12">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mid-gray mb-8">
                Live Comparison &middot; Austin Metro
              </p>
              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[13px] font-semibold tracking-[0.1em] uppercase text-navy">
                      SuperSearch
                    </span>
                    <span className="text-3xl font-bold text-navy">847</span>
                  </div>
                  <div className="h-3 bg-navy rounded-full" />
                </div>
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[13px] font-medium tracking-[0.1em] uppercase text-mid-gray">
                      Zillow
                    </span>
                    <span className="text-3xl font-bold text-mid-gray">612</span>
                  </div>
                  <div className="h-3 bg-mid-gray/40 rounded-full" style={{ width: "72%" }} />
                </div>
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[13px] font-medium tracking-[0.1em] uppercase text-mid-gray">
                      Realtor.com
                    </span>
                    <span className="text-3xl font-bold text-mid-gray">580</span>
                  </div>
                  <div className="h-3 bg-mid-gray/40 rounded-full" style={{ width: "68%" }} />
                </div>
                <div className="pt-4 border-t border-navy/10">
                  <p className="text-gold text-sm font-semibold">
                    +235 properties invisible to every other platform
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ─── STATS BAR ─── */}
      <section className="bg-navy py-16 md:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <StatsCounter />
        </div>
      </section>

      {/* ─── FEATURED LISTINGS ─── */}
      {featuredListings.length > 0 && (
        <RevealSection className="section-padding bg-warm-gray">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="flex items-end justify-between mb-12 md:mb-16">
              <div>
                <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
                  Curated Properties
                </p>
                <h2 className="text-3xl md:text-5xl font-light">
                  New to <span className="font-semibold">Market</span>
                </h2>
              </div>
              <Link
                href="/search"
                className="hidden md:inline-flex text-[12px] font-semibold tracking-[0.1em] uppercase text-navy/50 hover:text-gold transition-colors"
              >
                Explore All {totalListings.toLocaleString()} &rarr;
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group bg-white overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-[4/3] bg-navy/5 relative overflow-hidden img-zoom">
                    {listing.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.imageUrl} alt={listing.address} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-navy/5">
                        <svg className="w-12 h-12 text-navy/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1">
                      {listing.listingType}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-lg font-semibold text-navy group-hover:text-gold transition-colors mb-1">
                      {listing.priceAmount ? `$${listing.priceAmount.toLocaleString()}` : "Contact for Price"}
                    </p>
                    <p className="text-sm text-navy/70 mb-2 truncate">{listing.address}</p>
                    <p className="text-[12px] text-mid-gray mb-2">{listing.city}</p>
                    <div className="flex items-center gap-3 text-[12px] text-mid-gray">
                      {listing.beds && <span>{listing.beds} bed</span>}
                      {listing.baths && <span>{listing.baths} bath</span>}
                      {listing.buildingSf && <span>{listing.buildingSf.toLocaleString()} SF</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10 md:hidden">
              <Link href="/search" className="btn-outline-dark">Explore All Listings</Link>
            </div>
          </div>
        </RevealSection>
      )}

      {/* ─── NEIGHBORHOODS ─── */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              Hyperlocal Expertise
            </p>
            <h2 className="text-3xl md:text-5xl font-light">
              We Know These <span className="font-semibold">Streets</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { name: "Downtown", slug: "downtown" },
              { name: "78704", slug: "78704" },
              { name: "Westlake", slug: "westlake" },
              { name: "East Side", slug: "east-side" },
            ].map((hood) => (
              <Link
                key={hood.slug}
                href={`/neighborhoods/${hood.slug}`}
                className="group relative aspect-[3/4] overflow-hidden"
              >
                <div className="absolute inset-0 bg-navy/40 group-hover:bg-navy/20 transition-colors duration-500 z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                <div className="absolute inset-0 bg-navy" />
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 z-20">
                  <h3 className="text-white text-lg md:text-xl font-semibold tracking-wide">
                    {hood.name}
                  </h3>
                  <span className="text-white/50 text-[12px] font-medium tracking-[0.1em] uppercase group-hover:text-gold transition-colors">
                    Explore &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ─── SERVICES ─── */}
      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-3 gap-0">
            {/* Buy */}
            <div className="p-10 md:p-12 border-b md:border-b-0 md:border-r border-navy/10">
              <div className="mb-6">
                <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-light mb-4">
                Your Next Home <span className="font-semibold">Exists</span>
              </h3>
              <p className="text-mid-gray text-sm leading-relaxed mb-8">
                Most buyers see what Zillow shows them and think that&apos;s the market.
                It&apos;s not. SuperSearch pulls from every source — MLS, off-market networks,
                luxury exclusives, and pocket listings your agent down the street
                doesn&apos;t know about. You see everything. You miss nothing.
              </p>
              <Link href="/buy" className="btn-outline-dark">
                See How We Buy
              </Link>
            </div>

            {/* Sell */}
            <div className="p-10 md:p-12 border-b md:border-b-0 md:border-r border-navy/10">
              <div className="mb-6">
                <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-light mb-4">
                Sell for <span className="font-semibold">More</span>
              </h3>
              <p className="text-mid-gray text-sm leading-relaxed mb-8">
                Our listings move fast because we price with data, not guesswork,
                and market with precision, not templates. Custom photography.
                Targeted digital campaigns. Strategic pricing that creates urgency.
                The result: multiple offers and above-asking closes.
              </p>
              <Link href="/valuation" className="btn-outline-dark">
                Get My Valuation
              </Link>
            </div>

            {/* Invest */}
            <div className="p-10 md:p-12">
              <div className="mb-6">
                <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-light mb-4">
                Invest <span className="font-semibold">Smarter</span>
              </h3>
              <p className="text-mid-gray text-sm leading-relaxed mb-8">
                Our investment calculator analyzes cash flow, cap rates, and ROI
                in real time. Combine it with SuperSearch&apos;s off-market data
                and you&apos;ll find deals other investors never see.
              </p>
              <Link href="/investment" className="btn-outline-dark">
                Analyze a Property
              </Link>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ─── TEAM PREVIEW ─── */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              The Team
            </p>
            <h2 className="text-3xl md:text-5xl font-light">
              Data-Driven. <span className="font-semibold">Client-Obsessed.</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { name: "David Shapiro", title: "Broker Associate / CVO", img: "https://shapirore.com/wp-content/uploads/2026/03/shapiroheadshots133352-scaled.jpg" },
              { name: "Lee Abraham", title: "Chief Real Estate Officer", img: "https://shapirore.com/wp-content/uploads/2026/03/shapiroheadshots131841-scaled.jpg" },
              { name: "Mitchell Sheppard", title: "Buyer Specialist", img: "https://shapirore.com/wp-content/uploads/2026/03/resized-scaled.jpg" },
              { name: "Pau Simon", title: "Operations", img: "https://shapirore.com/wp-content/uploads/2024/03/Untitled-design-scaled.jpg" },
            ].map((member) => (
              <Link key={member.name} href="/team" className="group text-center">
                <div className="relative aspect-[3/4] mb-4 overflow-hidden img-zoom">
                  <Image
                    src={member.img} alt={member.name} fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <h3 className="text-base md:text-lg font-semibold tracking-wide group-hover:text-gold transition-colors">
                  {member.name}
                </h3>
                <p className="text-mid-gray text-[12px] font-medium tracking-[0.1em] uppercase mt-1">
                  {member.title}
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/team" className="btn-outline-dark">
              Meet the Full Team
            </Link>
          </div>
        </div>
      </RevealSection>

      {/* ─── EXPLORE BY PRICE / TYPE ─── */}
      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-light">
              Search by <span className="font-semibold">Category</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Under $400K", href: "/search?searchMode=residential&priceMax=400000", desc: "Starter homes" },
              { label: "$400K – $750K", href: "/search?searchMode=residential&priceMin=400000&priceMax=750000", desc: "Mid-range" },
              { label: "$750K – $1.5M", href: "/search?searchMode=residential&priceMin=750000&priceMax=1500000", desc: "Move-up" },
              { label: "$1.5M+", href: "/search?searchMode=residential&priceMin=1500000", desc: "Luxury" },
              { label: "Condos", href: "/condos", desc: "Urban living" },
              { label: "New Builds", href: "/new-construction", desc: "Brand new" },
              { label: "Investment", href: "/investment", desc: "Analyze ROI" },
              { label: "Commercial", href: "/search?searchMode=commercial", desc: "Office & retail" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="bg-white p-5 text-center hover:shadow-md transition-shadow group border border-navy/5"
              >
                <p className="text-lg font-semibold text-navy group-hover:text-gold transition-colors">{item.label}</p>
                <p className="text-[11px] text-mid-gray mt-1">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ─── TESTIMONIALS ─── */}
      <section className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              In Their Words
            </p>
            <h2 className="text-3xl md:text-5xl font-light text-white">
              Why Clients <span className="font-semibold">Choose Us</span>
            </h2>
          </div>
          <TestimonialSlider />
        </div>
      </section>

      {/* ─── CTA ─── */}
      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-5xl font-light mb-6">
            What&apos;s Your <span className="font-semibold">Next Move?</span>
          </h2>
          <p className="text-mid-gray text-base max-w-lg mx-auto mb-10">
            Whether you&apos;re buying your first home, selling at the top, or building a
            portfolio — we bring the technology, the data, and the relentlessness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search" className="btn-primary">
              Search Properties
            </Link>
            <Link href="/contact" className="btn-outline-dark">
              Talk to Us
            </Link>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
