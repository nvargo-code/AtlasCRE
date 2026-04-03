import Link from "next/link";
import type { Metadata } from "next";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Join Shapiro Group | Agent Recruitment | Austin Real Estate",
  description:
    "Join one of Austin's most tech-forward brokerages. SuperSearch, AI tools, CRM integration, and a modern platform that gives agents a competitive edge.",
};

const TECH_FEATURES = [
  {
    title: "SuperSearch",
    description: "Our proprietary search engine shows 15-30% more listings than Zillow. Your buyers see everything — MLS, off-market, broker-exclusive, and pocket listings.",
    stat: "30%",
    statLabel: "more listings",
  },
  {
    title: "AI Content Writer",
    description: "Generate listing descriptions, social posts, email campaigns, and follow-up messages in seconds. Atlas AI writes with your brand voice.",
    stat: "5",
    statLabel: "content types",
  },
  {
    title: "CMA Tool",
    description: "Run CMAs with data from more sources than MLS alone. Our comp analysis includes off-market sales and broker-exclusive data for more accurate pricing.",
    stat: "15+",
    statLabel: "comps per analysis",
  },
  {
    title: "Client Portal",
    description: "Compass-style collections, messaging, showing requests, and saved search alerts. Clients get a premium experience that keeps them engaged.",
    stat: "100%",
    statLabel: "branded to you",
  },
  {
    title: "Lead Scoring",
    description: "AI-powered lead scoring tells you who's hot, warm, or cold — with specific suggested actions for each client. Stop guessing, start closing.",
    stat: "3",
    statLabel: "intelligence tiers",
  },
  {
    title: "Marketing Engine",
    description: "Auto-generate Instagram posts, email blasts, flyers, and open house content for every listing. Copy, customize, post — done in minutes.",
    stat: "5",
    statLabel: "auto-generated formats",
  },
  {
    title: "Transaction Tracker",
    description: "Track every deal from contract to close. Milestone timeline, task checklist, compliance documents, and commission tracking — all in one place.",
    stat: "15",
    statLabel: "auto-created tasks",
  },
  {
    title: "Business Analytics",
    description: "Pipeline funnels, activity trends, revenue tracking, and team leaderboard. Know exactly where your business stands at all times.",
    stat: "Real-time",
    statLabel: "performance data",
  },
];

export default function JoinPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Agent Recruitment
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Build Your Business <br />
            with <span className="font-semibold">Better Technology</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-2xl mt-6">
            Most brokerages give you a CRM and a logo. We give you a platform that makes you more competitive —
            proprietary tools that generate leads, nurture clients, and close deals faster.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/contact" className="btn-primary">Let&apos;s Talk</Link>
            <Link href="/careers" className="btn-outline">See Open Roles</Link>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light">
              Your Brokerage vs. <span className="font-semibold">Shapiro Group</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Other */}
            <div className="border border-navy/10 p-8">
              <h3 className="text-lg font-semibold text-mid-gray mb-6">Typical Brokerage</h3>
              <ul className="space-y-3 text-sm text-mid-gray">
                {[
                  "Same MLS search as everyone else",
                  "Generic CRM template",
                  "Write your own listing descriptions",
                  "Manual social media posting",
                  "Excel spreadsheet for commissions",
                  "No client portal",
                  "No market data tools",
                  "Pay $200+/mo for basic IDX website",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-navy/20 mt-0.5">&#10005;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Shapiro */}
            <div className="border-2 border-gold p-8 bg-gold/5">
              <h3 className="text-lg font-semibold text-gold mb-6">Shapiro Group</h3>
              <ul className="space-y-3 text-sm text-navy">
                {[
                  "SuperSearch: 30% more listings than Zillow",
                  "GoHighLevel CRM with iMessage integration",
                  "AI generates descriptions, posts, emails in seconds",
                  "Auto-generated marketing for every listing",
                  "Commission tracker with pipeline forecasting",
                  "Full client portal with collections & messaging",
                  "CMA tool, market reports, investment calculator",
                  "Custom website with your listings — included",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-gold mt-0.5">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Tech Features Grid */}
      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              Your Toolkit
            </p>
            <h2 className="text-3xl md:text-4xl font-light">
              8 Proprietary <span className="font-semibold">Tools</span>
            </h2>
            <p className="text-mid-gray text-sm mt-3 max-w-lg mx-auto">
              Every tool is built in-house and included at no extra cost. No per-seat fees. No add-on charges.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TECH_FEATURES.map((feature) => (
              <div key={feature.title} className="bg-white p-6 border border-navy/10">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-gold">{feature.stat}</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-mid-gray">{feature.statLabel}</span>
                </div>
                <h3 className="text-base font-semibold text-navy mb-2">{feature.title}</h3>
                <p className="text-sm text-mid-gray leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Cost comparison */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[800px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl font-light mb-6">
            Save <span className="font-semibold">$1,000+/mo</span> on Tech
          </h2>
          <p className="text-mid-gray text-base mb-8">
            Agents at other brokerages pay $1,200-2,000/month for tools that don&apos;t work as well.
            At Shapiro Group, everything is included.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-navy/5 p-6 text-center">
              <p className="text-3xl font-bold text-mid-gray line-through">$1,500</p>
              <p className="text-[11px] text-mid-gray mt-1">Typical agent tech stack</p>
            </div>
            <div className="bg-gold/10 p-6 text-center border border-gold/30">
              <p className="text-3xl font-bold text-gold">$0</p>
              <p className="text-[11px] text-gold mt-1">Included with Shapiro Group</p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Ready to Level <span className="font-semibold">Up?</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            We&apos;re selective about who joins. If you&apos;re a driven agent who wants
            better technology, better leads, and a better platform — let&apos;s talk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary">Schedule a Confidential Chat</Link>
            <Link href="/careers" className="btn-outline">View Open Roles</Link>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
