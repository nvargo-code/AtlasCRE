import Link from "next/link";
import type { Metadata } from "next";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Austin Neighborhoods | Shapiro Group",
  description:
    "Explore Austin neighborhoods and find homes for sale. Downtown, 78704, Westlake, East Side, Riverside, and more. SuperSearch finds more listings than Zillow.",
};

const neighborhoods = [
  {
    name: "Downtown Austin",
    slug: "downtown",
    zip: "78701",
    tagline: "Urban living at its finest",
  },
  {
    name: "78704 - South Austin",
    slug: "78704",
    zip: "78704",
    tagline: "The soul of Austin",
  },
  {
    name: "Westlake",
    slug: "westlake",
    zip: "78746",
    tagline: "Premier luxury enclave",
  },
  {
    name: "East Austin",
    slug: "east-side",
    zip: "78702",
    tagline: "Creative and dynamic",
  },
  {
    name: "Riverside",
    slug: "riverside",
    zip: "78741",
    tagline: "Southeast Austin's rising star",
  },
  {
    name: "78745 - South Central",
    slug: "78745",
    zip: "78745",
    tagline: "Affordable South Austin",
  },
  {
    name: "78731 - Northwest Hills",
    slug: "78731",
    zip: "78731",
    tagline: "Established family neighborhood",
  },
  {
    name: "78723 - Windsor Park / Mueller",
    slug: "78723",
    zip: "78723",
    tagline: "Austin's best-kept secret",
  },
];

export default function NeighborhoodsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Explore Austin
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Our <span className="font-semibold">Neighborhoods</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-lg mt-6">
            From downtown high-rises to hill country estates — find the Austin
            neighborhood that fits your lifestyle.
          </p>
        </div>
      </section>

      {/* Grid */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {neighborhoods.map((hood) => (
              <Link
                key={hood.slug}
                href={`/neighborhoods/${hood.slug}`}
                className="group border border-navy/10 p-8 hover:border-gold/50 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gold bg-gold/10 px-3 py-1">
                    {hood.zip}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-navy group-hover:text-gold transition-colors mb-2">
                  {hood.name}
                </h2>
                <p className="text-mid-gray text-sm mb-6">{hood.tagline}</p>
                <span className="text-[12px] font-semibold tracking-[0.1em] uppercase text-navy/40 group-hover:text-gold transition-colors">
                  Explore &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-6">
            Don&apos;t See Your <span className="font-semibold">Neighborhood?</span>
          </h2>
          <p className="text-mid-gray text-base max-w-md mx-auto mb-10">
            SuperSearch covers all of Austin and DFW. Search any address, ZIP
            code, or neighborhood.
          </p>
          <Link href="/search" className="btn-primary">
            Search All Areas
          </Link>
        </div>
      </RevealSection>
    </>
  );
}
