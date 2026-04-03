import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RevealSection } from "@/components/public/RevealSection";
import { NEIGHBORHOODS, type NeighborhoodData, type Recommendation, type SchoolInfo } from "@/data/neighborhoods";
import { BUYER_AVATARS } from "@/data/avatars";
import { MarketDashboard } from "@/components/public/MarketDashboard";

// Fallback for neighborhoods not yet in the rich data set
const FALLBACK_NEIGHBORHOODS: Record<string, { name: string; zips: string[]; searchQuery: string; description: string }> = {
  "east-side": { name: "East Austin", zips: ["78702", "78721"], searchQuery: "78702", description: "Austin's fastest-growing and most dynamic neighborhood." },
  riverside: { name: "Riverside", zips: ["78741"], searchQuery: "Riverside Austin", description: "Southeast Austin's rising star with strong investment potential." },
  "78745": { name: "78745 — South Central", zips: ["78745"], searchQuery: "78745", description: "Affordable South Austin with easy downtown access." },
  "78731": { name: "78731 — Northwest Hills", zips: ["78731"], searchQuery: "78731", description: "Established family neighborhood near the Arboretum and Domain." },
  "78723": { name: "78723 — Windsor Park / Mueller", zips: ["78723"], searchQuery: "78723", description: "Northeast Austin anchored by the Mueller master-planned community." },
};

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hood = NEIGHBORHOODS.find((n) => n.slug === slug) || FALLBACK_NEIGHBORHOODS[slug];
  if (!hood) return { title: "Neighborhood Not Found | Shapiro Group" };
  return {
    title: `${hood.name} Homes for Sale | Local Guide | Shapiro Group`,
    description: `Complete guide to living in ${hood.name}. Best gyms, restaurants, schools, and homes for sale. SuperSearch finds more listings than Zillow. ${"heroTagline" in hood ? (hood as NeighborhoodData).heroTagline : hood.description}`,
  };
}

// Dynamic rendering — these pages query the database for listing stats
export const dynamic = "force-dynamic";

function RecommendationSection({ title, icon, items }: { title: string; icon: string; items: Recommendation[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-12">
      <h3 className="text-xl font-semibold text-navy mb-6 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.name} className="bg-warm-gray p-5">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-navy">{item.name}</h4>
              <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-gold bg-gold/10 px-2 py-0.5 flex-shrink-0 ml-2">
                {item.type}
              </span>
            </div>
            <p className="text-mid-gray text-sm leading-relaxed">{item.description}</p>
            {item.address && (
              <p className="text-[12px] text-navy/40 mt-2">{item.address}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SchoolsSection({ schools }: { schools: SchoolInfo[] }) {
  if (schools.length === 0) return null;
  return (
    <div className="mb-12">
      <h3 className="text-xl font-semibold text-navy mb-6">Schools</h3>
      <div className="space-y-3">
        {schools.map((school) => (
          <div key={school.name} className="flex items-center justify-between p-4 bg-warm-gray">
            <div>
              <h4 className="font-semibold text-navy">{school.name}</h4>
              <p className="text-[12px] text-mid-gray">{school.district} &middot; {school.type}</p>
              {school.notes && <p className="text-[12px] text-navy/50 mt-1">{school.notes}</p>}
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gold">{school.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function NeighborhoodPage({ params }: Props) {
  const { slug } = await params;
  const richHood = NEIGHBORHOODS.find((n) => n.slug === slug);
  const fallback = FALLBACK_NEIGHBORHOODS[slug];

  if (!richHood && !fallback) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-3xl font-semibold mb-4">Neighborhood Not Found</h1>
          <Link href="/neighborhoods" className="text-gold hover:underline">View All Neighborhoods</Link>
        </div>
      </div>
    );
  }

  const name = richHood?.name || fallback!.name;
  const zips = richHood?.zips || fallback!.zips;
  const searchQuery = richHood?.searchQuery || fallback!.searchQuery;

  // Fetch listing stats
  let totalListings = 0;
  let avg = "N/A";
  let recentListings: { id: string; address: string; city: string; priceAmount: number | null; priceUnit: string | null; beds: number | null; baths: number | null; buildingSf: number | null; propertyType: string; propSubType: string | null; imageUrl: string | null; listingType: string }[] = [];

  try {
    const [count, avgPrice, listings] = await Promise.all([
      prisma.listing.count({ where: { status: "active", zip: { in: zips } } }),
      prisma.listing.aggregate({ where: { status: "active", zip: { in: zips }, priceAmount: { not: null } }, _avg: { priceAmount: true } }),
      prisma.listing.findMany({
        where: { status: "active", zip: { in: zips } },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, address: true, city: true, priceAmount: true, priceUnit: true, beds: true, baths: true, buildingSf: true, propertyType: true, propSubType: true, imageUrl: true, listingType: true },
      }),
    ]);
    totalListings = count;
    avg = avgPrice._avg.priceAmount ? `$${Math.round(Number(avgPrice._avg.priceAmount) / 1000)}K` : "N/A";
    recentListings = listings.map((l) => ({ ...l, priceAmount: l.priceAmount ? Number(l.priceAmount) : null }));
  } catch (e) {
    console.error("Failed to fetch neighborhood data:", e);
  }

  // ── RICH NEIGHBORHOOD PAGE (has detailed data) ──
  if (richHood) {
    const topAvatars = BUYER_AVATARS
      .filter((a) => (richHood.avatarScores[a.id] || 0) >= 4)
      .sort((a, b) => (richHood.avatarScores[b.id] || 0) - (richHood.avatarScores[a.id] || 0));

    return (
      <>
        {/* JSON-LD for AEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Place",
              name: richHood.name,
              description: richHood.overview,
              address: { "@type": "PostalAddress", addressLocality: "Austin", addressRegion: "TX", postalCode: richHood.zips[0] },
              geo: { "@type": "GeoCoordinates", latitude: 30.267, longitude: -97.743 },
            }),
          }}
        />

        {/* Hero */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              Neighborhood Guide
            </p>
            <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
              {richHood.name}
            </h1>
            <p className="text-white/60 text-lg font-light max-w-2xl mt-6">
              {richHood.heroTagline}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href={`/search?searchMode=residential&q=${encodeURIComponent(searchQuery)}`} className="btn-primary">
                Search {name} Homes
              </Link>
              <Link href="/contact" className="btn-outline">
                Talk to a Local Expert
              </Link>
            </div>
          </div>
        </section>

        {/* Quick stats bar */}
        <section className="bg-white border-b border-navy/10 py-8">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-navy">{richHood.medianPrice}</p>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Median Price</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{richHood.walkScore}</p>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Walk Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{richHood.commuteDowntown}</p>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">To Downtown</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{totalListings}</p>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Active Listings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{zips.join(", ")}</p>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">ZIP Code{zips.length > 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Overview */}
        <RevealSection className="section-padding bg-white">
          <div className="max-w-[800px] mx-auto px-6 md:px-10">
            <h2 className="text-2xl md:text-3xl font-light text-navy mb-6">
              What It&apos;s Like to <span className="font-semibold">Live Here</span>
            </h2>
            <p className="text-mid-gray text-base leading-relaxed mb-6">{richHood.overview}</p>
            <div className="bg-warm-gray p-6 border-l-2 border-gold">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gold mb-2">The Vibe</p>
              <p className="text-navy text-sm leading-relaxed">{richHood.vibe}</p>
            </div>
          </div>
        </RevealSection>

        {/* Best for... sections */}
        <RevealSection className="section-padding bg-warm-gray">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <h2 className="text-2xl md:text-3xl font-light text-navy mb-10 text-center">
              Who Thrives in <span className="font-semibold">{name}</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Entrepreneurs & Founders", content: richHood.whyEntrepreneurs, icon: "rocket" },
                { title: "Health & Biohacking", content: richHood.whyHealth, icon: "heart" },
                { title: "Families with Kids", content: richHood.whyFamilies, icon: "home" },
                { title: "Investors", content: richHood.whyInvestors, icon: "chart" },
              ].map((section) => (
                <div key={section.title} className="bg-white p-8">
                  <h3 className="text-lg font-semibold text-navy mb-3">{section.title}</h3>
                  <p className="text-mid-gray text-sm leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* Market Dashboard */}
        <RevealSection className="section-padding bg-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="text-center mb-12">
              <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
                Market Data
              </p>
              <h2 className="text-3xl md:text-4xl font-light">
                {name} <span className="font-semibold">Market Trends</span>
              </h2>
              <p className="text-mid-gray text-sm mt-3 max-w-lg mx-auto">
                Real-time pricing, inventory, and activity data powered by SuperSearch.
              </p>
            </div>
            <MarketDashboard zips={zips} neighborhoodName={name} searchMode="residential" />
          </div>
        </RevealSection>

        {/* Local recommendations */}
        <RevealSection className="section-padding bg-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="text-center mb-12">
              <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
                Local Guide
              </p>
              <h2 className="text-3xl md:text-4xl font-light">
                The Best of <span className="font-semibold">{name}</span>
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-x-12">
              <div>
                <RecommendationSection title="Fitness & Gyms" icon="💪" items={richHood.fitness} />
                <RecommendationSection title="Restaurants" icon="🍽" items={richHood.restaurants} />
                <RecommendationSection title="Coffee" icon="☕" items={richHood.coffee} />
                <RecommendationSection title="Outdoors & Parks" icon="🌳" items={richHood.outdoors} />
              </div>
              <div>
                <RecommendationSection title="Wellness & Biohacking" icon="🧊" items={richHood.wellness} />
                <RecommendationSection title="Coworking" icon="💻" items={richHood.coworking} />
                <RecommendationSection title="Grocery & Health Food" icon="🛒" items={richHood.grocery} />
                <RecommendationSection title="Family Activities" icon="👨‍👩‍👧‍👦" items={richHood.familyFriendly} />
              </div>
            </div>
          </div>
        </RevealSection>

        {/* Schools */}
        {richHood.schools.length > 0 && (
          <RevealSection className="section-padding bg-warm-gray">
            <div className="max-w-[800px] mx-auto px-6 md:px-10">
              <div className="text-center mb-10">
                <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
                  Education
                </p>
                <h2 className="text-3xl md:text-4xl font-light">
                  Schools in <span className="font-semibold">{name}</span>
                </h2>
              </div>
              <SchoolsSection schools={richHood.schools} />
            </div>
          </RevealSection>
        )}

        {/* Local secrets */}
        {richHood.localSecrets.length > 0 && (
          <RevealSection className="section-padding bg-navy">
            <div className="max-w-[800px] mx-auto px-6 md:px-10">
              <div className="text-center mb-10">
                <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
                  Insider Knowledge
                </p>
                <h2 className="text-3xl md:text-4xl font-light text-white">
                  Things Only <span className="font-semibold">Locals Know</span>
                </h2>
              </div>
              <div className="space-y-6">
                {richHood.localSecrets.map((secret, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gold text-sm font-bold">{i + 1}</span>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{secret}</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        )}

        {/* Avatar fit */}
        {topAvatars.length > 0 && (
          <RevealSection className="section-padding bg-white">
            <div className="max-w-[1400px] mx-auto px-6 md:px-10">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-light">
                  Best Fit <span className="font-semibold">Buyers</span>
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {topAvatars.map((avatar) => (
                  <div key={avatar.id} className="border border-navy/10 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-navy">{avatar.name}</h3>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className={`w-2 h-2 rounded-full ${
                              star <= (richHood.avatarScores[avatar.id] || 0) ? "bg-gold" : "bg-navy/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-mid-gray text-sm">{avatar.tagline}</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        )}

        {/* Listings */}
        <RevealSection className="section-padding bg-warm-gray">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light">
                Homes in <span className="font-semibold">{name}</span>
              </h2>
              <p className="text-mid-gray text-sm mt-2">Price range: {richHood.priceRange}</p>
            </div>
            {recentListings.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentListings.map((listing) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`} className="group bg-white overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] bg-navy/5 relative overflow-hidden img-zoom">
                      {listing.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={listing.imageUrl} alt={listing.address} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><span className="text-mid-gray text-sm">No Image</span></div>
                      )}
                      <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1">{listing.listingType}</span>
                    </div>
                    <div className="p-5">
                      <p className="text-lg font-semibold text-navy group-hover:text-gold transition-colors mb-1">
                        {listing.priceAmount ? `$${listing.priceAmount.toLocaleString()}` : "Contact for Price"}
                      </p>
                      <p className="text-sm text-navy/70 truncate">{listing.address}</p>
                      <div className="flex items-center gap-3 mt-2 text-[12px] text-mid-gray">
                        {listing.beds && <span>{listing.beds} bed</span>}
                        {listing.baths && <span>{listing.baths} bath</span>}
                        {listing.buildingSf && <span>{listing.buildingSf.toLocaleString()} SF</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-mid-gray mb-4">No active listings in the database yet.</p>
                <Link href={`/search?searchMode=residential&q=${encodeURIComponent(searchQuery)}`} className="btn-primary">Search with SuperSearch</Link>
              </div>
            )}
            <div className="text-center mt-10">
              <Link href={`/search?searchMode=residential&q=${encodeURIComponent(searchQuery)}`} className="btn-outline-dark">
                View All {name} Listings
              </Link>
            </div>
          </div>
        </RevealSection>

        {/* CTA */}
        <RevealSection className="section-padding bg-navy">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Ready to Live in <span className="font-semibold">{name}?</span>
            </h2>
            <p className="text-white/50 text-base max-w-md mx-auto mb-10">
              Our team knows {name} block by block. Let us find your perfect home —
              including off-market opportunities you won&apos;t find online.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-primary">Talk to a Local Expert</Link>
              <Link href={`/search?searchMode=residential&q=${encodeURIComponent(searchQuery)}`} className="btn-outline">Search {name}</Link>
            </div>
          </div>
        </RevealSection>
      </>
    );
  }

  // ── FALLBACK PAGE (neighborhoods without rich data yet) ──
  const fb = fallback!;
  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">Neighborhoods</p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">{fb.name}</h1>
          <p className="text-white/50 text-lg font-light max-w-2xl mt-6">{fb.description}</p>
          <div className="mt-10">
            <Link href={`/search?searchMode=residential&q=${encodeURIComponent(fb.searchQuery)}`} className="btn-primary">Search {fb.name} Homes</Link>
          </div>
        </div>
      </section>
      <section className="bg-white py-12 border-b border-navy/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 grid grid-cols-3 gap-8 text-center">
          <div><p className="text-3xl font-bold text-navy">{totalListings}</p><p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mt-2">Active Listings</p></div>
          <div><p className="text-3xl font-bold text-navy">{avg}</p><p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mt-2">Avg. List Price</p></div>
          <div><p className="text-3xl font-bold text-navy">{fb.zips.join(", ")}</p><p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mt-2">ZIP Code{fb.zips.length > 1 ? "s" : ""}</p></div>
        </div>
      </section>
      {/* Market Dashboard */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              Market Data
            </p>
            <h2 className="text-3xl md:text-4xl font-light">
              {fb.name} <span className="font-semibold">Market Trends</span>
            </h2>
          </div>
          <MarketDashboard zips={fb.zips} neighborhoodName={fb.name} searchMode="residential" />
        </div>
      </RevealSection>

      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl font-light mb-6">Detailed guide for {fb.name} <span className="font-semibold">coming soon</span></h2>
          <p className="text-mid-gray mb-8">In the meantime, search all available listings with SuperSearch.</p>
          <Link href={`/search?searchMode=residential&q=${encodeURIComponent(fb.searchQuery)}`} className="btn-primary">Search {fb.name}</Link>
        </div>
      </RevealSection>
    </>
  );
}
