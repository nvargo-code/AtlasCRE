import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Austin Condos & Townhomes for Sale | SuperSearch | Shapiro Group",
  description:
    "Search condos and townhomes for sale in Austin. Downtown high-rises, Domain condos, East Austin lofts, and more. SuperSearch finds listings others miss.",
};

export const dynamic = "force-dynamic";

export default async function CondosPage() {
  let listings: { id: string; address: string; city: string; priceAmount: number | null; beds: number | null; baths: number | null; buildingSf: number | null; imageUrl: string | null }[] = [];
  let count = 0;

  try {
    [count, listings] = await Promise.all([
      prisma.listing.count({
        where: { status: "active", searchMode: "residential", propSubType: { in: ["Condo", "Townhouse", "Condominium"] } },
      }),
      prisma.listing.findMany({
        where: { status: "active", searchMode: "residential", propSubType: { in: ["Condo", "Townhouse", "Condominium"] } },
        select: { id: true, address: true, city: true, priceAmount: true, beds: true, baths: true, buildingSf: true, imageUrl: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);
  } catch { /* fallback to empty */ }

  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">Condos & Townhomes</p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Austin <span className="font-semibold">Condos</span> for Sale
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-6">
            From downtown high-rises to boutique townhomes — SuperSearch finds {count > 0 ? count.toLocaleString() : ""} condos and townhomes across Austin, including off-market units.
          </p>
          <div className="mt-10">
            <Link href="/search?searchMode=residential&propSubType=Condo,Townhouse" className="btn-primary">
              Search All Condos
            </Link>
          </div>
        </div>
      </section>

      {listings.length > 0 && (
        <RevealSection className="section-padding bg-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <h2 className="text-2xl font-light text-navy mb-8 text-center">
              Latest <span className="font-semibold">Condos & Townhomes</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((l) => (
                <Link key={l.id} href={`/listings/${l.id}`} className="group bg-white border border-navy/10 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] bg-navy/5 relative overflow-hidden img-zoom">
                    {l.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imageUrl} alt={l.address} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-mid-gray text-sm">No Image</div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-lg font-semibold text-navy group-hover:text-gold transition-colors">
                      {l.priceAmount ? `$${Number(l.priceAmount).toLocaleString()}` : "Contact for Price"}
                    </p>
                    <p className="text-sm text-navy/70 truncate">{l.address}</p>
                    <p className="text-[12px] text-mid-gray">{l.city}</p>
                    <div className="flex gap-3 mt-2 text-[12px] text-mid-gray">
                      {l.beds && <span>{l.beds} bed</span>}
                      {l.baths && <span>{l.baths} bath</span>}
                      {l.buildingSf && <span>{Number(l.buildingSf).toLocaleString()} SF</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/search?searchMode=residential&propSubType=Condo,Townhouse" className="btn-outline-dark">
                View All {count} Condos
              </Link>
            </div>
          </div>
        </RevealSection>
      )}

      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl font-light text-white mb-6">
            Looking for the <span className="font-semibold">Perfect Condo?</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            Our team specializes in Austin condos and townhomes. Let us help you find the right fit — including units that aren&apos;t listed publicly yet.
          </p>
          <Link href="/contact" className="btn-primary">Talk to a Condo Specialist</Link>
        </div>
      </RevealSection>
    </>
  );
}
