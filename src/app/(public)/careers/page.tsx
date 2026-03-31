import Link from "next/link";
import type { Metadata } from "next";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Careers | Join the Shapiro Group",
  description:
    "Join Austin's most tech-forward real estate team. $100-140K first year potential, proprietary SuperSearch technology, and a culture of excellence.",
};

const benefits = [
  {
    title: "Proprietary Technology",
    description:
      "SuperSearch gives you and your clients an unfair advantage — more listings than Zillow, off-market data, and AI-powered insights no other Austin team has.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Warm Referrals",
    description:
      "No cold calling. We generate inbound leads through SuperSearch, content marketing, and our growing digital presence. You focus on closing.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: "14 Days Paid Vacation",
    description:
      "Real estate doesn't have to mean burnout. We believe in sustainable performance, so you get real time off — paid.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Admin Support",
    description:
      "A dedicated operations coordinator handles transaction management, marketing execution, and scheduling so you can focus on clients.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Mentorship",
    description:
      "Work alongside experienced agents who've closed hundreds of transactions. Learn data-driven pricing, negotiation, and market analysis.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: "Off-Market Investment Access",
    description:
      "Build your own portfolio with access to off-market deals, pocket listings, and investment opportunities before they hit the public market.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

export default function CareersPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Careers
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            You Deserve Better<br />
            <span className="font-semibold">Than Your Current Brokerage</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-lg mt-6">
            Most brokerages hand you a desk and a phone. We hand you proprietary
            technology, warm leads, a support team, and the freedom to actually
            build a business instead of just surviving in one.
          </p>
        </div>
      </section>

      {/* Income */}
      <section className="bg-gold py-16 md:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <p className="text-white/80 text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            First Year Potential
          </p>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-3">
            $100K &ndash; $140K
          </h2>
          <p className="text-white/80 text-base">
            Managing $15&ndash;$20M in annual business volume
          </p>
        </div>
      </section>

      {/* Benefits */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-16">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              Why Shapiro Group
            </p>
            <h2 className="text-3xl md:text-5xl font-light">
              The Shapiro <span className="font-semibold">Difference</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="p-8 border border-navy/10 hover:border-gold/30 transition-colors"
              >
                <div className="text-gold mb-5">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-navy mb-3">
                  {benefit.title}
                </h3>
                <p className="text-mid-gray text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Requirements */}
      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
                Open Position
              </p>
              <h2 className="text-3xl md:text-4xl font-light mb-6">
                All-Star Real Estate <span className="font-semibold">Agent</span>
              </h2>
              <p className="text-mid-gray text-base leading-relaxed mb-8">
                We&apos;re looking for experienced agents who want to leverage
                cutting-edge technology, work with a high-performing team, and
                grow their business without the grind.
              </p>

              <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mid-gray mb-4">
                Requirements
              </h3>
              <ul className="space-y-3 text-navy text-sm">
                {[
                  "20+ completed real estate transactions",
                  "Active Texas real estate license",
                  "High integrity and professionalism",
                  "Tech-proficient and eager to learn new tools",
                  "Passion for client service and market knowledge",
                ].map((req) => (
                  <li key={req} className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-navy p-10 text-white flex flex-col justify-center">
              <h3 className="text-2xl font-light mb-4">
                Ready to <span className="font-semibold">Apply?</span>
              </h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                Send your resume and a brief introduction to David. Use the
                subject line below so we know you&apos;re serious.
              </p>
              <div className="bg-white/5 border border-white/10 p-4 mb-6">
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/40 mb-1">
                  Subject Line
                </p>
                <p className="text-gold text-sm font-medium">
                  &quot;I am the Real Estate Agent that You Need&quot;
                </p>
              </div>
              <a
                href="mailto:david@shapirore.com?subject=I%20am%20the%20Real%20Estate%20Agent%20that%20You%20Need"
                className="btn-primary text-center"
              >
                Email David
              </a>
            </div>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
