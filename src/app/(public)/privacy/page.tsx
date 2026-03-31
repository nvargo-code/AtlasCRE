import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Shapiro Group",
  description: "Privacy policy for the Shapiro Group website and SuperSearch platform.",
};

export default function PrivacyPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-[800px] mx-auto px-6 md:px-10">
        <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
          Legal
        </p>
        <h1 className="text-3xl md:text-4xl font-light text-navy mb-12">
          Privacy <span className="font-semibold">Policy</span>
        </h1>

        <div className="prose prose-sm max-w-none text-navy/70 leading-relaxed space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-navy mb-3">Information We Collect</h2>
            <p>
              When you use the Shapiro Group website and SuperSearch platform, we may
              collect personal information you provide directly, including your name,
              email address, phone number, and property preferences. We also collect
              usage data including search queries, pages visited, and interaction patterns
              to improve our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy mb-3">How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide property search results and recommendations</li>
              <li>Send you listing alerts and market updates you request</li>
              <li>Connect you with our agents for property inquiries</li>
              <li>Improve our SuperSearch platform and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy mb-3">Data Sharing</h2>
            <p>
              We do not sell your personal information to third parties. We may share
              your information with our CRM platform (GoHighLevel) for lead management
              and follow-up, and with eXp Realty as required by our brokerage agreement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy mb-3">Data Retention</h2>
            <p>
              We retain personal information for a maximum of 2 years after your last
              interaction with our services, unless a longer retention period is required
              by law or for legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy mb-3">Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal
              information at any time by contacting us at{" "}
              <a href="mailto:team@shapirogroup.co" className="text-gold hover:underline">
                team@shapirogroup.co
              </a>
              . You can unsubscribe from marketing emails using the link in any email
              we send.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy mb-3">Cookies & Analytics</h2>
            <p>
              We use cookies and similar technologies to analyze site usage and improve
              performance. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy mb-3">TREC Consumer Protection</h2>
            <p>
              Texas Real Estate Commission Consumer Protection Notice:{" "}
              <a
                href="https://www.trec.texas.gov/forms/consumer-protection-notice"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                TREC Consumer Protection Notice
              </a>
            </p>
            <p className="mt-2">
              Texas Real Estate Commission Information About Brokerage Services:{" "}
              <a
                href="https://shapirore.com/IABS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                IABS
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy mb-3">Contact</h2>
            <p>
              Shapiro Real Estate Group<br />
              2028 Ben White Blvd, Suite 240-7070<br />
              Austin, TX 78741<br />
              <a href="mailto:team@shapirogroup.co" className="text-gold hover:underline">
                team@shapirogroup.co
              </a>
              {" "}&middot;{" "}
              <a href="tel:5125376023" className="text-gold hover:underline">
                512.537.6023
              </a>
            </p>
          </section>

          <p className="text-[12px] text-mid-gray pt-4 border-t border-navy/10">
            Last updated: March 2026
          </p>
        </div>
      </div>
    </div>
  );
}
