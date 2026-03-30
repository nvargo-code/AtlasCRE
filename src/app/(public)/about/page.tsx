import Link from "next/link";
import type { Metadata } from "next";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Our Story | Shapiro Group",
  description:
    "Why we built SuperSearch. How a frustration with incomplete data became Austin's most comprehensive property search platform.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Our Story
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight max-w-3xl">
            We Got Tired of Incomplete Data.<br />
            <span className="font-semibold">So We Fixed It.</span>
          </h1>
        </div>
      </section>

      {/* Origin story */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[800px] mx-auto px-6 md:px-10">
          <div className="space-y-6 text-base leading-relaxed">
            <p className="text-navy text-lg font-medium">
              The Shapiro Group started with a simple question: why does every real
              estate portal show buyers the same incomplete picture?
            </p>

            <p className="text-mid-gray">
              David Shapiro bought his first property as a teenager. Over the next
              fifteen years, he built a career around one conviction: in real estate,
              the person with the best information wins. Not the loudest. Not the
              most connected. The best informed.
            </p>

            <p className="text-mid-gray">
              But the tools available to buyers and sellers were broken. Zillow shows
              MLS listings — the minimum. Realtor.com shows roughly the same. Every
              consumer portal pulls from the same feed and calls it comprehensive.
              Meanwhile, a meaningful percentage of Austin properties trade through
              broker networks, off-market channels, pocket listings, and private deals
              that never appear on a public website.
            </p>

            <p className="text-mid-gray">
              We saw the gap. We built the solution.
            </p>

            <h2 className="text-2xl font-semibold text-navy pt-4">
              SuperSearch: The Platform We Wished Existed
            </h2>

            <p className="text-mid-gray">
              SuperSearch aggregates listings from every source we can find — MLS,
              commercial databases, luxury networks, broker-exclusive inventories,
              and proprietary data channels that took years to build. The result
              is a search that consistently surfaces more properties than Zillow,
              Redfin, or Realtor.com can show.
            </p>

            <p className="text-mid-gray">
              We didn&apos;t build it to be cute. We built it because our clients
              were missing properties. Good properties. Properties that sold before
              they ever knew they existed. That was unacceptable.
            </p>

            <h2 className="text-2xl font-semibold text-navy pt-4">
              A Brokerage That Thinks Like a Tech Company
            </h2>

            <p className="text-mid-gray">
              Most brokerages buy off-the-shelf CRM software, subscribe to an IDX
              feed, and call it technology. We write code. We build tools. We treat
              real estate data like a competitive advantage because it is one.
            </p>

            <p className="text-mid-gray">
              That doesn&apos;t mean we&apos;re robots. Behind the technology is a small,
              relentless team that actually answers the phone, gives honest advice,
              negotiates hard, and never forgets that buying or selling a home is
              one of the most consequential decisions a person makes.
            </p>

            <p className="text-navy text-lg font-medium pt-4">
              Better data. Better strategy. Better outcomes.
              That&apos;s the Shapiro Group.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* Values */}
      <RevealSection className="section-padding bg-warm-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="text-center mb-16">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              How We Operate
            </p>
            <h2 className="text-3xl md:text-4xl font-light">
              Principles, Not <span className="font-semibold">Slogans</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Data Over Opinion",
                copy: "We don't price homes by feel. We don't recommend neighborhoods by vibes. Every recommendation comes with the data behind it. You'll always know the why.",
              },
              {
                title: "Radical Transparency",
                copy: "If a property is overpriced, we'll say so. If your timeline is unrealistic, we'll tell you. We'd rather lose a deal with honesty than win one with spin.",
              },
              {
                title: "Speed as a Weapon",
                copy: "In Austin's market, the best properties don't wait. Our technology surfaces opportunities in real time. Our team moves on them the same day. Slow agents lose deals. We don't.",
              },
            ].map((value) => (
              <div key={value.title} className="p-8 border border-navy/10 bg-white">
                <h3 className="text-lg font-semibold text-navy mb-3">{value.title}</h3>
                <p className="text-mid-gray text-sm leading-relaxed">{value.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Brokered by */}
      <RevealSection className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <p className="text-mid-gray text-sm mb-2">Brokered by</p>
          <p className="text-navy text-xl font-light tracking-wide">eXp Realty</p>
          <p className="text-mid-gray text-sm mt-4 max-w-lg mx-auto">
            We chose eXp for the same reason we built SuperSearch — access to
            better tools, a global referral network, and the freedom to operate
            like the tech-forward brokerage our clients deserve.
          </p>
        </div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            See the Difference <span className="font-semibold">for Yourself</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            Open SuperSearch and compare. We think the data speaks for itself.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search" className="btn-primary">
              Open SuperSearch
            </Link>
            <Link href="/team" className="btn-outline">
              Meet the Team
            </Link>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
