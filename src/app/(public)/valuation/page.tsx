import type { Metadata } from "next";
import { ValuationForm } from "@/components/public/ValuationForm";
import { RevealSection } from "@/components/public/RevealSection";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What's Your Home Worth? | Free Valuation | Shapiro Group",
  description:
    "Get a free, data-driven market analysis of your Austin home. Not a Zestimate — a real valuation from agents who know your neighborhood.",
};

export default function ValuationPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Atlas Pricing
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            How Much is Your Home<br />
            <span className="font-semibold">Actually Worth?</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-6">
            Not an algorithm. Not a Zestimate. A real market analysis from an agent
            who knows your street, your competition, and your timing — powered by
            data sources Zillow doesn&apos;t have.
          </p>
        </div>
      </section>

      {/* Form section */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-16 md:gap-24">
            <div>
              <h2 className="text-2xl md:text-3xl font-light text-navy mb-6">
                Get Your Free <span className="font-semibold">Valuation</span>
              </h2>
              <p className="text-mid-gray text-base leading-relaxed mb-8">
                Tell us about your property and we&apos;ll send you a comprehensive
                market analysis within 24 hours. No obligation. No pressure. Just data.
              </p>

              <ValuationForm />
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-light text-navy mb-6">
                Why Our Valuations <span className="font-semibold">Are Different</span>
              </h2>

              <div className="space-y-8">
                {[
                  {
                    title: "Off-Market Comp Data",
                    copy: "We include off-market and pocket listing sales that never hit MLS — transactions Zillow and Redfin can't see. This gives you a truer picture of what your neighborhood is actually trading at.",
                  },
                  {
                    title: "Hyperlocal Context",
                    copy: "A comp from three blocks away might be meaningless if it's across a school district line. We factor in the micro-details that algorithms miss — lot position, view corridors, flood zones, upcoming development.",
                  },
                  {
                    title: "Strategic, Not Just Accurate",
                    copy: "We don't just tell you what your home is worth. We tell you what it should be listed at, when to list it, and how to price it to generate the outcome you want — whether that's speed, maximum price, or both.",
                  },
                  {
                    title: "Human + Data",
                    copy: "Our valuations combine proprietary data from Atlas Intelligence with boots-on-the-ground market knowledge. The algorithm sets the range. The agent sharpens the number.",
                  },
                ].map((item) => (
                  <div key={item.title} className="border-l-2 border-gold pl-6">
                    <h3 className="text-base font-semibold text-navy mb-2">{item.title}</h3>
                    <p className="text-mid-gray text-sm leading-relaxed">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Thinking About <span className="font-semibold">Selling?</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            Read about the Atlas Selling System — how we price, prepare, market,
            and negotiate to get you more.
          </p>
          <Link href="/sell" className="btn-primary">
            How We Sell Homes
          </Link>
        </div>
      </RevealSection>
    </>
  );
}
