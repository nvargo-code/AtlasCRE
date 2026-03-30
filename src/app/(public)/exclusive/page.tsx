import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Exclusive Listings | Shapiro Group",
  description:
    "Curated properties from the Shapiro Group — our own listings, off-market exclusives, and hand-selected opportunities in Austin, TX.",
};

export const revalidate = 300;

export default async function ExclusivePage() {
  let listings: { id: string; address: string; city: string; state: string; zip: string | null; priceAmount: number | null; priceUnit: string | null; beds: number | null; baths: number | null; buildingSf: number | null; lotSizeAcres: number | null; propertyType: string; propSubType: string | null; imageUrl: string | null; listingType: string; searchMode: string; description: string | null }[] = [];

  try {
    const raw = await prisma.listing.findMany({
      where: { status: "active" },
      orderBy: { priceAmount: "desc" },
      take: 12,
      select: {
        id: true, address: true, city: true, state: true, zip: true,
        priceAmount: true, priceUnit: true, beds: true, baths: true,
        buildingSf: true, lotSizeAcres: true, propertyType: true,
        propSubType: true, imageUrl: true, listingType: true,
        searchMode: true, description: true,
      },
    });
    listings = raw.map((l) => ({
      ...l,
      priceAmount: l.priceAmount ? Number(l.priceAmount) : null,
      lotSizeAcres: l.lotSizeAcres ? Number(l.lotSizeAcres) : null,
    }));
  } catch (e) {
    console.error("Failed to fetch exclusive listings:", e);
  }

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Shapiro Group Collection
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Our Exclusive <span className="font-semibold">Listings</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-6">
            Properties represented by the Shapiro Group — curated, priced with data,
            and marketed with precision. These are the homes we stand behind.
          </p>
        </div>
      </section>

      {/* Listings grid */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          {listings.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {listings.map((listing, i) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className={`group ${i === 0 ? "md:col-span-2" : ""}`}
                >
                  <div className={`${i === 0 ? "aspect-[16/7]" : "aspect-[16/10]"} bg-navy/5 relative overflow-hidden img-zoom`}>
                    {listing.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.imageUrl}
                        alt={listing.address}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-navy/5">
                        <div className="text-center">
                          <svg className="w-16 h-16 text-navy/10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-gold text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1.5">
                        Exclusive
                      </span>
                      <span className="bg-navy/80 text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1.5">
                        {listing.listingType}
                      </span>
                    </div>
                  </div>

                  <div className="py-5">
                    <div className="flex items-baseline justify-between mb-2">
                      <h2 className={`${i === 0 ? "text-2xl md:text-3xl" : "text-xl"} font-semibold text-navy group-hover:text-gold transition-colors`}>
                        {listing.priceAmount
                          ? `$${listing.priceAmount.toLocaleString()}`
                          : "Contact for Price"}
                      </h2>
                      <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray">
                        {listing.propSubType || listing.propertyType}
                      </span>
                    </div>
                    <p className="text-navy/70 text-base mb-1">{listing.address}</p>
                    <p className="text-mid-gray text-sm mb-3">
                      {listing.city}, {listing.state} {listing.zip}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-mid-gray">
                      {listing.beds && <span>{listing.beds} Beds</span>}
                      {listing.baths && <span>{listing.baths} Baths</span>}
                      {listing.buildingSf && <span>{listing.buildingSf.toLocaleString()} SF</span>}
                      {listing.lotSizeAcres && <span>{listing.lotSizeAcres} Acres</span>}
                    </div>
                    {i === 0 && listing.description && (
                      <p className="text-mid-gray text-sm leading-relaxed mt-4 line-clamp-2">
                        {listing.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-mid-gray text-lg mb-6">
                Our exclusive collection is being curated. In the meantime,
                explore everything with SuperSearch.
              </p>
              <Link href="/search" className="btn-primary">
                Open SuperSearch
              </Link>
            </div>
          )}
        </div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-6">
            See Beyond <span className="font-semibold">Our Collection</span>
          </h2>
          <p className="text-mid-gray text-base max-w-lg mx-auto mb-10">
            SuperSearch aggregates every listing in the Austin metro — not just
            ours. Open it and see what you&apos;ve been missing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search" className="btn-primary">
              Open SuperSearch
            </Link>
            <Link href="/sell" className="btn-outline-dark">
              List With Us
            </Link>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
