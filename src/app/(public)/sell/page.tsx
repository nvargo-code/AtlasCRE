import Link from "next/link";
import type { Metadata } from "next";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Sell Your Austin Home for More | Shapiro Group",
  description:
    "Data-driven pricing. Precision marketing. Strategic negotiation. The Shapiro Group sells Austin homes faster and for more than the market average.",
};

const steps = [
  {
    number: "01",
    title: "Atlas Pricing",
    subtitle: "Data, Not Guesswork",
    description:
      "We don't price homes by gut feel. Atlas Pricing uses MLS comps, our proprietary sold database (including off-market transactions other agents can't see), real-time absorption rates, and neighborhood-level demand signals. The result is a price that's strategically positioned — high enough to maximize your return, precise enough to create urgency.",
  },
  {
    number: "02",
    title: "Atlas Prep",
    subtitle: "First Impressions, Engineered",
    description:
      "Before a single photo is taken, we walk your home and identify exactly what moves the needle. Not a generic punch list — a targeted return-on-investment analysis. Which improvements generate 3x their cost and which are a waste of money. We bring the contractors, the stagers, and the eye. You bring the keys.",
  },
  {
    number: "03",
    title: "Atlas Studio",
    subtitle: "Your Home Deserves Better Than an iPhone",
    description:
      "Professional architectural photography. Cinematic video walkthroughs. Drone aerials that put your property in context. 3D virtual tours for out-of-town buyers. Every asset is designed to stop the scroll, drive showings, and make your listing the one buyers remember.",
  },
  {
    number: "04",
    title: "Atlas Reach",
    subtitle: "Precision Marketing, Not Spray and Pray",
    description:
      "Your listing doesn't just go on MLS and wait. We deploy targeted digital campaigns to active buyers in your price range. Social media content designed to go viral in Austin real estate circles. Email blasts to our buyer database. Broker outreach to agents with qualified, looking-now clients. Every eyeball is intentional.",
  },
  {
    number: "05",
    title: "The Close",
    subtitle: "Negotiation is an Art. We Treat It Like One.",
    description:
      "When offers come in, we don't just relay numbers. We analyze every term — escalation clauses, appraisal gaps, financing strength, inspection waivers, timeline flexibility. We negotiate not just for the highest price, but for the cleanest close. The goal: maximum net proceeds, minimum stress, zero surprises.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Listing & Seller Representation — Shapiro Group",
  provider: { "@type": "RealEstateAgent", name: "Shapiro Group", url: "https://shapirogroup.co" },
  serviceType: "Real Estate Listing Agency",
  areaServed: { "@type": "City", name: "Austin" },
  description: "Sell your Austin home for more. Data-driven pricing, professional marketing, and access to more buyers through SuperSearch.",
};

export default function SellPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Sell With Us
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Your Home is Worth More<br />
            <span className="font-semibold">Than a Template Listing.</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-6">
            Most agents list your home on MLS, post it to Zillow, and hope for
            the best. We don&apos;t believe in hope as a strategy. We believe in
            data, precision marketing, and negotiation that leaves money on your
            side of the table.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/valuation" className="btn-primary">
              Get My Valuation
            </Link>
            <Link href="/search" className="btn-outline">
              See Market Data
            </Link>
          </div>
        </div>
      </section>

      {/* Value stats */}
      <RevealSection className="py-16 md:py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-navy/10">
            {[
              {
                stat: "48 hrs",
                label: "Average Time to Multiple Offers",
                sub: "Strategic pricing creates competition. Competition creates above-asking offers.",
              },
              {
                stat: "102%",
                label: "Average Sale-to-List Ratio",
                sub: "Our sellers consistently close above their asking price. Consistently.",
              },
              {
                stat: "2x",
                label: "Buyer Exposure vs. Traditional",
                sub: "SuperSearch puts your listing in front of active buyers other platforms miss.",
              },
            ].map((item) => (
              <div key={item.label} className="text-center py-8 md:py-0 md:px-8">
                <div className="text-4xl md:text-5xl font-bold text-gold mb-3">
                  {item.stat}
                </div>
                <p className="text-navy font-semibold text-sm tracking-wide mb-2">
                  {item.label}
                </p>
                <p className="text-mid-gray text-sm">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* The difference */}
      <RevealSection className="py-16 md:py-20 bg-gold">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
            The difference between &ldquo;listed&rdquo; and &ldquo;<span className="font-semibold">sold above asking</span>&rdquo;?
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            A strategy. Not a template. Every home we represent gets a custom plan
            built from data, executed with precision, and negotiated with your
            net proceeds as the only scoreboard.
          </p>
        </div>
      </RevealSection>

      {/* Process — branded Atlas services */}
      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-16">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              The Atlas Selling System
            </p>
            <h2 className="text-3xl md:text-5xl font-light">
              Five Stages. <span className="font-semibold">Zero Guesswork.</span>
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
                  <h3 className="text-xl md:text-2xl font-semibold mb-1">
                    {step.title}
                  </h3>
                  <p className="text-gold text-sm font-medium mb-3">{step.subtitle}</p>
                  <p className="text-mid-gray text-base leading-relaxed max-w-2xl">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Why not the other guys */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              The Honest Truth
            </p>
            <h2 className="text-3xl md:text-4xl font-light mb-8">
              Why Most Listings <span className="font-semibold">Underperform</span>
            </h2>
            <div className="space-y-6 text-base leading-relaxed">
              <p className="text-mid-gray">
                The median Austin listing agent takes photos with their phone, writes a
                generic MLS description, sets a price based on what the neighbor sold for
                six months ago, and waits. That&apos;s not a strategy. That&apos;s a coin flip.
              </p>
              <p className="text-mid-gray">
                We price with real-time data — including off-market comps most agents
                don&apos;t have access to. We market with professional assets that stop the scroll.
                We negotiate every term, not just the price. And we manage the transaction
                so you never have to chase a deadline.
              </p>
              <p className="text-navy font-medium">
                The difference isn&apos;t marginal. It&apos;s tens of thousands of dollars on
                your bottom line.
              </p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            How Much is Your Home <span className="font-semibold">Actually Worth?</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            Not a Zestimate. A real market analysis from someone who knows your
            neighborhood, your competition, and your timing.
          </p>
          <Link href="/contact" className="btn-primary">
            Get My Valuation
          </Link>
        </div>
      </RevealSection>
    </>
  );
}
