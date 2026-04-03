import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compare Austin Neighborhoods | Shapiro Group",
  description: "Compare Austin neighborhoods side-by-side: median price, active listings, walk score, commute times, and local highlights.",
};

export const dynamic = "force-dynamic";

async function getNeighborhoodStats(zips: string[]) {
  const [count, avgPrice] = await Promise.all([
    prisma.listing.count({ where: { status: "active", searchMode: "residential", zip: { in: zips } } }),
    prisma.listing.aggregate({
      where: { status: "active", searchMode: "residential", zip: { in: zips }, priceAmount: { not: null } },
      _avg: { priceAmount: true },
    }),
  ]);
  return {
    activeListings: count,
    avgPrice: avgPrice._avg.priceAmount ? Math.round(Number(avgPrice._avg.priceAmount)) : null,
  };
}

export default async function NeighborhoodComparePage() {
  // Get stats for all rich neighborhoods
  const neighborhoods = await Promise.all(
    NEIGHBORHOODS.map(async (hood) => {
      const stats = await getNeighborhoodStats(hood.zips);
      return { ...hood, stats };
    })
  );

  return (
    <>
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <Link href="/neighborhoods" className="text-gold text-[12px] font-semibold tracking-[0.2em] uppercase hover:text-gold-dark mb-4 inline-block">
            &larr; All Neighborhoods
          </Link>
          <h1 className="text-3xl md:text-5xl font-light text-white">
            Compare <span className="font-semibold">Neighborhoods</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-4">
            Side-by-side comparison of Austin&apos;s top neighborhoods — pricing, lifestyle, and market data.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-navy">
                  <th className="text-left p-4 text-[10px] font-semibold tracking-wider uppercase text-mid-gray w-40">Feature</th>
                  {neighborhoods.map((hood) => (
                    <th key={hood.slug} className="p-4 text-center min-w-[160px]">
                      <Link href={`/neighborhoods/${hood.slug}`} className="text-navy font-semibold hover:text-gold transition-colors">
                        {hood.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Median Price */}
                <tr className="border-b border-navy/10">
                  <td className="p-4 text-[11px] font-semibold tracking-wider uppercase text-mid-gray">Median Price</td>
                  {neighborhoods.map((hood) => (
                    <td key={hood.slug} className="p-4 text-center font-semibold text-gold">{hood.medianPrice}</td>
                  ))}
                </tr>
                {/* Price Range */}
                <tr className="border-b border-navy/10 bg-warm-gray/50">
                  <td className="p-4 text-[11px] font-semibold tracking-wider uppercase text-mid-gray">Price Range</td>
                  {neighborhoods.map((hood) => (
                    <td key={hood.slug} className="p-4 text-center text-navy text-[12px]">{hood.priceRange}</td>
                  ))}
                </tr>
                {/* Active Listings */}
                <tr className="border-b border-navy/10">
                  <td className="p-4 text-[11px] font-semibold tracking-wider uppercase text-mid-gray">Active Listings</td>
                  {neighborhoods.map((hood) => (
                    <td key={hood.slug} className="p-4 text-center font-semibold text-navy">{hood.stats.activeListings}</td>
                  ))}
                </tr>
                {/* Walk Score */}
                <tr className="border-b border-navy/10 bg-warm-gray/50">
                  <td className="p-4 text-[11px] font-semibold tracking-wider uppercase text-mid-gray">Walk Score</td>
                  {neighborhoods.map((hood) => (
                    <td key={hood.slug} className="p-4 text-center text-navy">{hood.walkScore}</td>
                  ))}
                </tr>
                {/* Commute */}
                <tr className="border-b border-navy/10">
                  <td className="p-4 text-[11px] font-semibold tracking-wider uppercase text-mid-gray">To Downtown</td>
                  {neighborhoods.map((hood) => (
                    <td key={hood.slug} className="p-4 text-center text-navy">{hood.commuteDowntown}</td>
                  ))}
                </tr>
                {/* ZIP */}
                <tr className="border-b border-navy/10 bg-warm-gray/50">
                  <td className="p-4 text-[11px] font-semibold tracking-wider uppercase text-mid-gray">ZIP Code(s)</td>
                  {neighborhoods.map((hood) => (
                    <td key={hood.slug} className="p-4 text-center text-mid-gray text-[12px]">{hood.zips.join(", ")}</td>
                  ))}
                </tr>
                {/* Vibe */}
                <tr className="border-b border-navy/10">
                  <td className="p-4 text-[11px] font-semibold tracking-wider uppercase text-mid-gray">Vibe</td>
                  {neighborhoods.map((hood) => (
                    <td key={hood.slug} className="p-4 text-center text-mid-gray text-[12px] leading-relaxed">{hood.vibe.slice(0, 80)}...</td>
                  ))}
                </tr>
                {/* Schools */}
                <tr className="border-b border-navy/10 bg-warm-gray/50">
                  <td className="p-4 text-[11px] font-semibold tracking-wider uppercase text-mid-gray">Top School</td>
                  {neighborhoods.map((hood) => (
                    <td key={hood.slug} className="p-4 text-center text-navy text-[12px]">
                      {hood.schools[0] ? `${hood.schools[0].name} (${hood.schools[0].rating})` : "—"}
                    </td>
                  ))}
                </tr>
                {/* Actions */}
                <tr>
                  <td className="p-4"></td>
                  {neighborhoods.map((hood) => (
                    <td key={hood.slug} className="p-4 text-center">
                      <Link
                        href={`/neighborhoods/${hood.slug}`}
                        className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark"
                      >
                        Full Guide &rarr;
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-12 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-2xl font-light text-white mb-4">
            Can&apos;t Decide? <span className="font-semibold">We Can Help.</span>
          </h2>
          <p className="text-white/50 text-sm max-w-md mx-auto mb-8">
            Our team lives and works in these neighborhoods. Tell us what matters to you and we&apos;ll recommend the perfect fit.
          </p>
          <Link href="/find" className="btn-primary">Find My Neighborhood</Link>
        </div>
      </section>
    </>
  );
}
