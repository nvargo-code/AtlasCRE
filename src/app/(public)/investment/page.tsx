import type { Metadata } from "next";
import { InvestmentCalculator } from "@/components/public/InvestmentCalculator";
import { RevealSection } from "@/components/public/RevealSection";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Investment Calculator | Analyze Rental Property ROI | Shapiro Group",
  description:
    "Calculate cash flow, cap rate, cash-on-cash return, and ROI for investment properties in Austin and DFW. Free tool from Shapiro Group.",
};

export default function InvestmentPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Investment Property Calculator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    provider: {
      "@type": "RealEstateAgent",
      name: "Shapiro Group",
      url: "https://shapirogroup.co",
    },
    description: "Free rental property investment calculator. Analyze cash flow, cap rate, cash-on-cash return, and ROI for Austin real estate investments.",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Investor Tools
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Investment <span className="font-semibold">Calculator</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-6">
            Analyze any rental property — cash flow, cap rate, cash-on-cash return, and projected ROI.
            Make data-driven investment decisions.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
          <InvestmentCalculator />
        </div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Ready to <span className="font-semibold">Invest?</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            Our team specializes in helping investors find properties with strong returns
            in Austin and DFW. SuperSearch finds investment opportunities others miss.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary">Talk to an Investor Specialist</Link>
            <Link href="/search?searchMode=residential" className="btn-outline">Search Investment Properties</Link>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
