import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "New Construction Homes in Austin | SuperSearch | Shapiro Group",
  description:
    "Find new construction homes in Austin. New builds, move-in ready homes, and builder communities. SuperSearch tracks every new construction listing in the Austin metro.",
};

export const dynamic = "force-dynamic";

export default async function NewConstructionPage() {
  const currentYear = new Date().getFullYear();
  let listings: { id: string; address: string; city: string; priceAmount: number | null; beds: number | null; baths: number | null; buildingSf: number | null; imageUrl: string | null; yearBuilt: number | null }[] = [];
  let count = 0;

  try {
    [count, listings] = await Promise.all([
      prisma.listing.count({
        where: { status: "active", searchMode: "residential", yearBuilt: { gte: currentYear - 1 } },
      }),
      prisma.listing.findMany({
        where: { status: "active", searchMode: "residential", yearBuilt: { gte: currentYear - 1 } },
        select: { id: true, address: true, city: true, priceAmount: true, beds: true, baths: true, buildingSf: true, imageUrl: true, yearBuilt: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);
  } catch { /* fallback */ }

  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">New Builds</p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            New <span className="font-semibold">Construction</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-6">
            Brand new homes in Austin — {currentYear - 1} and {currentYear} builds. From starter homes in the suburbs to custom luxury new construction.
          </p>
          <div className="mt-10">
            <Link href={`/search?searchMode=residential&yearBuiltMin=${currentYear - 1}`} className="btn-primary">
              Search New Construction
            </Link>
          </div>
        </div>
      </section>

      {listings.length > 0 && (
        <RevealSection className="section-padding bg-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <h2 className="text-2xl font-light text-navy mb-8 text-center">
              {count} New <span className="font-semibold">Construction Homes</span>
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
                    <span className="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1">
                      New Build {l.yearBuilt}
                    </span>
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
              <Link href={`/search?searchMode=residential&yearBuiltMin=${currentYear - 1}`} className="btn-outline-dark">
                View All New Construction
              </Link>
            </div>
          </div>
        </RevealSection>
      )}

      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8">
              <h3 className="text-lg font-semibold text-navy mb-3">Builder Negotiations</h3>
              <p className="text-mid-gray text-sm leading-relaxed">
                Having an agent represent you with a builder costs you nothing — and we negotiate upgrades, closing costs, and terms that buyers walking in alone won&apos;t get.
              </p>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-navy mb-3">Inspection Matters</h3>
              <p className="text-mid-gray text-sm leading-relaxed">
                New doesn&apos;t mean perfect. We ensure proper inspections are done on new builds — foundation, electrical, plumbing, and more — before you close.
              </p>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-navy mb-3">All Communities</h3>
              <p className="text-mid-gray text-sm leading-relaxed">
                SuperSearch tracks new construction from every builder in Austin — not just the ones with the biggest marketing budgets. See everything available.
              </p>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl font-light text-white mb-6">
            Building Your <span className="font-semibold">Dream Home?</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            We work with every major builder in the Austin market. Let us help you find the right community, floor plan, and lot.
          </p>
          <Link href="/contact" className="btn-primary">Talk to Us</Link>
        </div>
      </RevealSection>
    </>
  );
}
