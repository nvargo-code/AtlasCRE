import type { Metadata } from "next";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Fair Housing Statement | Shapiro Group",
  description: "Shapiro Group's commitment to fair housing and equal opportunity in real estate.",
};

export default function FairHousingPage() {
  return (
    <>
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-navy">
        <div className="max-w-[800px] mx-auto px-6 md:px-10">
          <h1 className="text-3xl md:text-5xl font-light text-white">
            Fair Housing <span className="font-semibold">Statement</span>
          </h1>
        </div>
      </section>

      <RevealSection className="section-padding bg-white">
        <div className="max-w-[800px] mx-auto px-6 md:px-10">
          <div className="bg-warm-gray p-8 mb-8 text-center">
            <p className="text-lg font-semibold text-navy mb-2">Equal Opportunity Housing</p>
            <p className="text-mid-gray text-sm leading-relaxed">
              Shapiro Group is committed to providing equal housing opportunities regardless of race, color, religion, sex, national origin, disability, familial status, or any other characteristic protected by law.
            </p>
          </div>

          <div className="prose prose-sm prose-navy">
            <h2>Our Commitment</h2>
            <p>Shapiro Group fully supports the principles of the Fair Housing Act and all applicable federal, state, and local fair housing laws. We are committed to ensuring that all people enjoy the right to equal housing opportunities.</p>

            <h2>Federal Fair Housing Act</h2>
            <p>The Fair Housing Act prohibits discrimination in the sale, rental, and financing of housing based on race, color, national origin, religion, sex, familial status, and disability. Texas law provides additional protections.</p>

            <h2>What This Means for You</h2>
            <ul>
              <li>Every client receives the same level of service, professionalism, and access to listings</li>
              <li>We do not steer clients toward or away from neighborhoods based on protected characteristics</li>
              <li>Our SuperSearch platform displays all available listings without discrimination</li>
              <li>We accommodate reasonable requests from clients with disabilities</li>
              <li>Marketing materials represent the diverse communities we serve</li>
            </ul>

            <h2>Report a Concern</h2>
            <p>If you believe you have experienced discrimination in housing, you may file a complaint with:</p>
            <ul>
              <li><strong>HUD</strong>: 1-800-669-9777 or <a href="https://www.hud.gov/fairhousing" target="_blank" rel="noopener noreferrer">hud.gov/fairhousing</a></li>
              <li><strong>Texas Workforce Commission</strong>: 1-888-452-4778</li>
              <li><strong>Shapiro Group</strong>: <a href="mailto:david@shapirogroup.co">david@shapirogroup.co</a></li>
            </ul>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
