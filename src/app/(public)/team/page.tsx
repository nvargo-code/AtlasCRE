import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Our Team | Shapiro Group",
  description:
    "Meet the Shapiro Group team — Austin's real estate experts with deep local knowledge and cutting-edge technology.",
};

const team = [
  {
    name: "David Shapiro",
    title: "Chief Visionary Officer",
    subtitle: "Broker Associate / Realtor, GREEN, CLHMS Guild",
    img: "https://shapirore.com/wp-content/uploads/2026/03/shapiroheadshots133352-scaled.jpg",
    bio: "David bought his first investment property before he was old enough to toast the transaction. That early obsession with real estate data — what's undervalued, what's mispriced, what the market is about to do — never went away. It became the foundation for the Shapiro Group and the driving force behind SuperSearch, the proprietary platform he built to surface listings that consumer portals miss. Over 15 years and hundreds of transactions later, David's approach hasn't changed: decisions based on data, execution driven by speed, and a refusal to leave money on the table for his clients.",
    email: "david@shapirore.com",
    phone: "512.537.6023",
    social: {
      instagram: "https://www.instagram.com/davidshapiroatx",
      linkedin: "https://www.linkedin.com/in/dashapiro/",
      youtube: "https://www.youtube.com/channel/UCQ75VyzTBO-er0IxYBYKWMQ",
    },
  },
  {
    name: "Lee Abraham",
    title: "Chief Real Estate Officer",
    subtitle: "Realtor",
    img: "https://shapirore.com/wp-content/uploads/2026/03/shapiroheadshots131841-scaled.jpg",
    bio: "Lee is the closer. As Chief Real Estate Officer, he takes the data-driven strategy David builds and executes it with surgical precision — from the first showing to the final signature. His clients describe him as the agent who never drops the ball, never sugarcoats the truth, and never stops negotiating until the deal is done right. Lee's deep knowledge of Austin neighborhoods means he often knows a property's real value before the appraisal comes back.",
    email: "team@shapirogroup.co",
    phone: "512.537.6023",
    social: {},
  },
  {
    name: "Mitchell Sheppard",
    title: "Buyer Specialist",
    subtitle: "Realtor",
    img: "https://shapirore.com/wp-content/uploads/2026/03/resized-scaled.jpg",
    bio: "Mitchell doesn't show homes — he finds them. As the team's buyer specialist, he's the person digging through SuperSearch results at 6am, flagging off-market opportunities, and running numbers on properties before his clients even know they exist. First-time buyers trust Mitchell because he explains everything without talking down. Experienced investors trust him because he does the homework. Everyone trusts him because he's genuinely on their side.",
    email: "team@shapirogroup.co",
    phone: "512.537.6023",
    social: {},
  },
  {
    name: "Pau Simon",
    title: "Operations Coordinator",
    subtitle: "",
    img: "https://shapirore.com/wp-content/uploads/2024/03/Untitled-design-scaled.jpg",
    bio: "Every seamless closing has someone behind the scenes making sure nothing falls through the cracks. That's Pau. She manages transaction timelines, coordinates vendors, tracks every deadline, and keeps the entire operation running on schedule. When clients say working with the Shapiro Group felt effortless, it's largely because Pau made sure every moving piece landed exactly where it should.",
    email: "team@shapirogroup.co",
    phone: "512.537.6023",
    social: {},
  },
];

export default function TeamPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Shapiro Group",
    url: "https://shapirogroup.co",
    telephone: "512-537-6023",
    email: "team@shapirogroup.co",
    address: {
      "@type": "PostalAddress",
      streetAddress: "2028 Ben White Blvd, Suite 240-7070",
      addressLocality: "Austin",
      addressRegion: "TX",
      postalCode: "78741",
    },
    employee: team.map((m) => ({
      "@type": "Person",
      name: m.name,
      jobTitle: m.title,
      email: m.email,
      telephone: m.phone,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Our Team
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Small Team.<br />
            <span className="font-semibold">Outsized Results.</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-lg mt-6">
            We&apos;re not a factory that churns through clients. Four people, deep
            expertise, proprietary technology, and a genuine obsession with getting
            you the best possible outcome.
          </p>
        </div>
      </section>

      {/* Team Members */}
      {team.map((member, i) => (
        <RevealSection
          key={member.name}
          className={`section-padding ${i % 2 === 0 ? "bg-white" : "bg-warm-gray"}`}
        >
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <div className={`grid lg:grid-cols-2 gap-12 md:gap-20 items-center ${i % 2 === 1 ? "lg:direction-rtl" : ""}`}>
              {/* Photo */}
              <div className={`${i % 2 === 1 ? "lg:order-2" : ""}`}>
                <div className="relative aspect-[3/4] max-w-md mx-auto lg:mx-0 overflow-hidden">
                  <Image
                    src={member.img}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>

              {/* Info */}
              <div className={`${i % 2 === 1 ? "lg:order-1" : ""}`}>
                <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-3">
                  {member.title}
                </p>
                <h2 className="text-3xl md:text-4xl font-light mb-2">
                  {member.name.split(" ")[0]}{" "}
                  <span className="font-semibold">{member.name.split(" ").slice(1).join(" ")}</span>
                </h2>
                {member.subtitle && (
                  <p className="text-mid-gray text-sm mb-6">{member.subtitle}</p>
                )}
                <p className="text-mid-gray text-base leading-relaxed mb-8">
                  {member.bio}
                </p>

                {/* Contact */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <a
                    href={`mailto:${member.email}`}
                    className="text-sm text-navy hover:text-gold transition-colors"
                  >
                    {member.email}
                  </a>
                  <a
                    href={`tel:${member.phone.replace(/\./g, "")}`}
                    className="text-sm text-navy hover:text-gold transition-colors"
                  >
                    {member.phone}
                  </a>
                </div>

                {/* Social */}
                {Object.keys(member.social).length > 0 && (
                  <div className="flex gap-4">
                    {member.social.instagram && (
                      <a
                        href={member.social.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-navy/40 hover:text-gold transition-colors"
                        aria-label="Instagram"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                      </a>
                    )}
                    {member.social.linkedin && (
                      <a
                        href={member.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-navy/40 hover:text-gold transition-colors"
                        aria-label="LinkedIn"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}
                    {member.social.youtube && (
                      <a
                        href={member.social.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-navy/40 hover:text-gold transition-colors"
                        aria-label="YouTube"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </RevealSection>
      ))}

      {/* CTA */}
      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Ready to Work <span className="font-semibold">Together?</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            Let&apos;s find your next property or get the best price for your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search" className="btn-primary">
              Search Properties
            </Link>
            <Link href="/contact" className="btn-outline">
              Contact Us
            </Link>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
