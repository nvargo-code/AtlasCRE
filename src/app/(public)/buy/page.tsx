import Link from "next/link";
import type { Metadata } from "next";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Buy a Home in Austin | SuperSearch Shows You Everything | Shapiro Group",
  description:
    "See every listing in Austin — including the ones Zillow doesn't have. Off-market properties, pocket listings, and broker exclusives. Shapiro Group SuperSearch.",
};

const steps = [
  {
    number: "01",
    title: "We Listen First",
    description:
      "Before we show you a single property, we sit down and learn what actually matters to you. Not just beds and baths — your commute, your weekends, your deal-breakers. We reverse-engineer the search from your life, not from a filter panel.",
  },
  {
    number: "02",
    title: "SuperSearch Does What Zillow Can't",
    description:
      "While other buyers scroll the same feed everyone else sees, yours runs through SuperSearch. We pull from MLS, off-market databases, luxury networks, and broker-only channels. Properties that sell before they're ever listed publicly? We see those. You see those.",
  },
  {
    number: "03",
    title: "We Tour With a Strategy",
    description:
      "We don't just open doors. Every showing comes with comps, pricing context, and a candid assessment of whether the property is worth your time. If it's overpriced, we'll tell you. If it's undervalued, we'll move fast. No cheerleading — just straight talk and market data.",
  },
  {
    number: "04",
    title: "Your Offer is Engineered to Win",
    description:
      "We've studied the listing agent, analyzed days on market, and know what the seller actually cares about. Your offer isn't a template — it's a strategy. The right price, the right terms, the right timing. Our win rate on competitive offers speaks for itself.",
  },
  {
    number: "05",
    title: "Contract to Keys, Fully Managed",
    description:
      "Inspections, appraisals, title work, lender coordination, closing logistics — our operations team manages every deadline so nothing falls through the cracks. You focus on packing. We focus on everything else.",
  },
];

export default function BuyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Buyer Representation — Shapiro Group",
    provider: { "@type": "RealEstateAgent", name: "Shapiro Group", url: "https://shapirogroup.co" },
    serviceType: "Real Estate Buyer Agency",
    areaServed: { "@type": "City", name: "Austin" },
    description: "Expert buyer representation in Austin, TX. SuperSearch finds more listings than Zillow — including off-market and broker-exclusive properties.",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Buy With Us
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Your Next Home Already Exists.<br />
            <span className="font-semibold">Most Agents Just Can&apos;t Find It.</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-6">
            The average Austin buyer sees the same listings as every other buyer —
            the ones Zillow, Redfin, and Realtor.com decide to show them. We built
            something different.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/search?searchMode=residential" className="btn-primary">
              Open SuperSearch
            </Link>
            <Link href="/find" className="btn-outline">
              Dream Home Finder
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <RevealSection className="py-16 md:py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-light text-navy mb-6">
              Here&apos;s what most buyers don&apos;t realize:
            </h2>
            <p className="text-lg text-mid-gray leading-relaxed mb-4">
              Consumer portals show you MLS listings — that&apos;s the minimum. But in Austin,
              a significant percentage of properties trade off-market, through pocket
              listings, broker networks, and private deals that never touch Zillow.
            </p>
            <p className="text-lg text-navy font-medium">
              If your agent only searches the MLS, you&apos;re competing for properties
              everyone already knows about — and missing the ones nobody else sees.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* SuperSearch callout */}
      <section className="bg-gold py-16 md:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-bold text-white mb-2">235+</p>
              <p className="text-white/80 text-sm">More listings than Zillow in the Austin metro</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold text-white mb-2">6</p>
              <p className="text-white/80 text-sm">Data sources aggregated beyond MLS</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold text-white mb-2">Real-time</p>
              <p className="text-white/80 text-sm">Live comparison against Zillow on every search</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-16">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              Our Process
            </p>
            <h2 className="text-3xl md:text-5xl font-light">
              How We Find <span className="font-semibold">What Others Miss</span>
            </h2>
          </div>

          <div className="space-y-0">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`grid md:grid-cols-[100px_1fr] gap-6 md:gap-12 py-10 md:py-14 ${
                  i < steps.length - 1 ? "border-b border-navy/10" : ""
                }`}
              >
                <div className="text-gold text-4xl md:text-5xl font-light">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-3">
                    {step.title}
                  </h3>
                  <p className="text-mid-gray text-base leading-relaxed max-w-2xl">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Who we serve */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "First-Time Buyers",
                copy: "Buying your first home is already overwhelming. We simplify the process, explain every step in plain English, and make sure you don't overpay or settle. SuperSearch ensures you see every option — not just the obvious ones.",
              },
              {
                title: "Move-Up Buyers",
                copy: "You know the market. You know what you want. You need an agent with the tools and network to find it before anyone else — and the negotiation skill to close it on your terms. That's us.",
              },
              {
                title: "Investors",
                copy: "Cap rates, cash flow, appreciation corridors — we speak your language. Our proprietary data goes deeper than MLS, surfacing off-market multi-family, commercial, and value-add opportunities across Austin and DFW.",
              },
            ].map((segment) => (
              <div key={segment.title} className="p-8 border border-navy/10">
                <h3 className="text-lg font-semibold text-navy mb-3">{segment.title}</h3>
                <p className="text-mid-gray text-sm leading-relaxed">{segment.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Stop Browsing. <span className="font-semibold">Start Finding.</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            Open SuperSearch and see the listings everyone else is missing.
            Or sit down with us and let&apos;s map out your move.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search?searchMode=residential" className="btn-primary">
              Open SuperSearch
            </Link>
            <Link href="/contact" className="btn-outline">
              Book a Consultation
            </Link>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
