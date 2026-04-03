import Link from "next/link";
import type { Metadata } from "next";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Austin Schools & School Districts | Homes Near Great Schools | Shapiro Group",
  description: "Find homes near Austin's top-rated schools. School ratings, districts, and homes for sale in the best school zones. SuperSearch helps you find the right neighborhood.",
};

export default function SchoolsPage() {
  // Collect all schools from neighborhoods
  const allSchools = NEIGHBORHOODS.flatMap((hood) =>
    hood.schools.map((school) => ({ ...school, neighborhood: hood.name, slug: hood.slug }))
  ).sort((a, b) => {
    // Sort by rating (numeric part)
    const ratingA = parseInt(a.rating) || 0;
    const ratingB = parseInt(b.rating) || 0;
    return ratingB - ratingA;
  });

  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            For Families
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Austin <span className="font-semibold">Schools</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-6">
            Find homes near Austin&apos;s top-rated schools. We know which neighborhoods
            have the best schools — and which homes are available near them.
          </p>
          <div className="mt-10">
            <Link href="/find" className="btn-primary">Find Homes by School</Link>
          </div>
        </div>
      </section>

      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1000px] mx-auto px-6 md:px-10">
          <h2 className="text-2xl font-light text-navy mb-8 text-center">
            Top-Rated <span className="font-semibold">Schools</span>
          </h2>

          <div className="space-y-3">
            {allSchools.map((school, i) => (
              <Link
                key={`${school.name}-${i}`}
                href={`/neighborhoods/${school.slug}`}
                className="flex items-center justify-between p-4 bg-warm-gray hover:shadow-md transition-shadow group"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-navy group-hover:text-gold transition-colors">{school.name}</h3>
                  <p className="text-[12px] text-mid-gray">
                    {school.district} &middot; {school.type} &middot; {school.neighborhood}
                  </p>
                  {school.notes && <p className="text-[11px] text-navy/40 mt-1">{school.notes}</p>}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <span className="text-xl font-bold text-gold">{school.rating}</span>
                </div>
              </Link>
            ))}
          </div>

          {allSchools.length === 0 && (
            <div className="text-center py-12 text-mid-gray">
              <p>School data is being compiled. Check individual neighborhood guides for school info.</p>
              <Link href="/neighborhoods" className="text-gold hover:text-gold-dark mt-4 inline-block">View Neighborhoods</Link>
            </div>
          )}
        </div>
      </RevealSection>

      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl font-light text-white mb-6">
            Schools Matter. So Does Your <span className="font-semibold">Home.</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            Tell us what school district or rating you need, and we&apos;ll find homes that fit — including off-market opportunities near the best schools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/find" className="btn-primary">Find My Dream Home</Link>
            <Link href="/neighborhoods" className="btn-outline">Explore Neighborhoods</Link>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
