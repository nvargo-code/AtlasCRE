import type { Metadata } from "next";
import { ContactForm } from "@/components/public/ContactForm";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Contact Us | Shapiro Group",
  description:
    "Get in touch with the Shapiro Group — Austin's real estate experts. Schedule a consultation, request a valuation, or ask a question.",
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Contact
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Start the <span className="font-semibold">Conversation</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-lg mt-6">
            No pressure. No pitch. Just a straight conversation about what
            you&apos;re looking to do and whether we&apos;re the right team to help you do it.
          </p>
        </div>
      </section>

      {/* Contact section */}
      <RevealSection className="section-padding bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-16 md:gap-24">
            {/* Form */}
            <div>
              <h2 className="text-2xl md:text-3xl font-light mb-8">
                Send Us a <span className="font-semibold">Message</span>
              </h2>
              <ContactForm />
            </div>

            {/* Info */}
            <div>
              <h2 className="text-2xl md:text-3xl font-light mb-8">
                Get In <span className="font-semibold">Touch</span>
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mid-gray mb-3">
                    Phone
                  </h3>
                  <a
                    href="tel:5125376023"
                    className="text-lg text-navy hover:text-gold transition-colors"
                  >
                    512.537.6023
                  </a>
                </div>

                <div>
                  <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mid-gray mb-3">
                    Email
                  </h3>
                  <a
                    href="mailto:team@shapirogroup.co"
                    className="text-lg text-navy hover:text-gold transition-colors"
                  >
                    team@shapirogroup.co
                  </a>
                </div>

                <div>
                  <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mid-gray mb-3">
                    Office
                  </h3>
                  <p className="text-lg text-navy leading-relaxed">
                    2028 Ben White Blvd<br />
                    Suite 240-7070<br />
                    Austin, TX 78741
                  </p>
                </div>

                <div>
                  <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mid-gray mb-3">
                    Brokerage
                  </h3>
                  <p className="text-mid-gray text-sm">
                    Shapiro Real Estate Group<br />
                    Brokered by eXp Realty
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
