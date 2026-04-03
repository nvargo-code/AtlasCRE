import type { Metadata } from "next";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Terms of Service | Shapiro Group",
  description: "Terms of service for shapirogroup.co and SuperSearch platform.",
};

export default function TermsPage() {
  return (
    <>
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-navy">
        <div className="max-w-[800px] mx-auto px-6 md:px-10">
          <h1 className="text-3xl md:text-5xl font-light text-white">
            Terms of <span className="font-semibold">Service</span>
          </h1>
          <p className="text-white/40 text-sm mt-4">Last updated: April 2026</p>
        </div>
      </section>

      <RevealSection className="section-padding bg-white">
        <div className="max-w-[800px] mx-auto px-6 md:px-10 prose prose-sm prose-navy">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using shapirogroup.co and the SuperSearch platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>

          <h2>2. Description of Service</h2>
          <p>Shapiro Group provides a real estate search and brokerage platform that aggregates property listings from multiple sources including MLS, off-market databases, and broker networks. The Service includes property search, saved searches, showing requests, market data, and related tools.</p>

          <h2>3. User Accounts</h2>
          <p>You may create an account to access premium features. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate, current, and complete information during registration.</p>

          <h2>4. Property Listings & Data</h2>
          <p>Listing data is aggregated from multiple sources and provided for informational purposes only. Shapiro Group does not guarantee the accuracy, completeness, or timeliness of any listing information. All listing data is subject to the terms and conditions of the originating MLS or data source. Prices, availability, and details may change without notice.</p>

          <h2>5. No Guarantee of Results</h2>
          <p>Market analyses, property valuations, investment calculations, and other tools provided through the Service are estimates only. They do not constitute professional appraisals, financial advice, or guarantees of any outcome. Always consult qualified professionals before making real estate or financial decisions.</p>

          <h2>6. Intellectual Property</h2>
          <p>The SuperSearch platform, including its design, features, code, and proprietary algorithms, is the property of Shapiro Group. You may not copy, modify, distribute, or create derivative works of any part of the Service without written permission.</p>

          <h2>7. Privacy</h2>
          <p>Your use of the Service is also governed by our <a href="/privacy">Privacy Policy</a>. By using the Service, you consent to the collection and use of information as described in the Privacy Policy.</p>

          <h2>8. Limitation of Liability</h2>
          <p>Shapiro Group shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the twelve months prior to the claim.</p>

          <h2>9. Brokerage Disclosure</h2>
          <p>Shapiro Group is a licensed real estate brokerage in the state of Texas. TREC License information is available at <a href="https://www.trec.texas.gov" target="_blank" rel="noopener noreferrer">trec.texas.gov</a>. The Texas Real Estate Commission consumer protection notice is available upon request.</p>

          <h2>10. Changes to Terms</h2>
          <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>

          <h2>11. Contact</h2>
          <p>Questions about these Terms? Contact us at <a href="mailto:david@shapirogroup.co">david@shapirogroup.co</a>.</p>
        </div>
      </RevealSection>
    </>
  );
}
