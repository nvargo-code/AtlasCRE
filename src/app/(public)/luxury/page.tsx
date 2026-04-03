import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Austin Luxury Homes for Sale | $1M+ | SuperSearch | Shapiro Group",
  description:
    "Luxury homes for sale in Austin over $1 million. Westlake estates, Tarrytown, Barton Hills, Lake Austin waterfront. SuperSearch includes off-market luxury listings.",
};

export const dynamic = "force-dynamic";

export default async function LuxuryPage() {
  let listings: { id: string; address: string; city: string; priceAmount: number | null; beds: number | null; baths: number | null; buildingSf: number | null; imageUrl: string | null; lotSizeAcres: number | null }[] = [];
  let count = 0;

  try {
    [count, listings] = await Promise.all([
      prisma.listing.count({
        where: { status: "active", searchMode: "residential", priceAmount: { gte: 1000000 } },
      }),
      prisma.listing.findMany({
        where: { status: "active", searchMode: "residential", priceAmount: { gte: 1000000 } },
        select: { id: true, address: true, city: true, priceAmount: true, beds: true, baths: true, buildingSf: true, imageUrl: true, lotSizeAcres: true },
        orderBy: { priceAmount: "desc" },
        take: 12,
      }),
    ]);
  } catch { /* fallback */ }

  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">Luxury Collection</p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Austin <span className="font-semibold">Luxury</span> Homes
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-6">
            Exceptional properties starting at $1M. SuperSearch includes exclusive off-market luxury listings from ALN and private broker networks that never appear on Zillow.
          </p>
          <div className="mt-10 flex gap-4">
            <Link href="/search?searchMode=residential&priceMin=1000000" className="btn-primary">
              Browse Luxury Listings
            </Link>
            <Link href="/contact" className="btn-outline">
              Private Consultation
            </Link>
          </div>
        </div>
      </section>

      {listings.length > 0 && (
        <RevealSection className="section-padding bg-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="text-center mb-12">
              <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">Featured</p>
              <h2 className="text-3xl font-light">
                {count.toLocaleString()} Luxury <span className="font-semibold">Properties</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((l) => (
                <Link key={l.id} href={`/listings/${l.id}`} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] bg-navy/5 relative overflow-hidden img-zoom">
                    {l.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imageUrl} alt={l.address} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-navy/5 text-mid-gray text-sm">No Image</div>
                    )}
                    <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1">Luxury</span>
                  </div>
                  <div className="p-5">
                    <p className="text-xl font-semibold text-navy group-hover:text-gold transition-colors">
                      {l.priceAmount ? `$${(Number(l.priceAmount) / 1_000_000).toFixed(2)}M` : "Contact for Price"}
                    </p>
                    <p className="text-sm text-navy/70 truncate">{l.address}</p>
                    <p className="text-[12px] text-mid-gray">{l.city}</p>
                    <div className="flex gap-3 mt-2 text-[12px] text-mid-gray">
                      {l.beds && <span>{l.beds} bed</span>}
                      {l.baths && <span>{l.baths} bath</span>}
                      {l.buildingSf && <span>{Number(l.buildingSf).toLocaleString()} SF</span>}
                      {l.lotSizeAcres && <span>{Number(l.lotSizeAcres)} acres</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/search?searchMode=residential&priceMin=1000000" className="btn-outline-dark">
                View All Luxury Homes
              </Link>
            </div>
          </div>
        </RevealSection>
      )}

      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl font-light text-navy mb-6">
            The <span className="font-semibold">SuperSearch Advantage</span> for Luxury
          </h2>
          <p className="text-mid-gray text-base max-w-lg mx-auto mb-10">
            Luxury buyers who only search Zillow miss 20-30% of the market. SuperSearch aggregates listings from ALN (Austin Luxury Network), private broker networks, and exclusive pocket listings — giving you access to properties that never hit public portals.
          </p>
          <Link href="/exclusive" className="btn-outline-dark">View Exclusive Listings</Link>
        </div>
      </RevealSection>

      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl font-light text-white mb-6">
            White-Glove <span className="font-semibold">Service</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            Luxury transactions require a different level of care. Our team provides discreet, personalized service for high-value properties — from private showings to confidential negotiations.
          </p>
          <Link href="/contact" className="btn-primary">Schedule a Consultation</Link>
        </div>
      </RevealSection>
    </>
  );
}
