import type { Metadata } from "next";
import { DreamHomeFinder } from "@/components/public/DreamHomeFinder";

export const metadata: Metadata = {
  title: "Dream Home Finder | Tell Us What You Want | Shapiro Group",
  description:
    "Describe your perfect Austin home and our team will find it — including off-market properties SuperSearch surfaces that you won't find on Zillow.",
};

export default function FindPage() {
  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
            Dream Home Finder
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Tell Us What <span className="font-semibold">Perfect Looks Like</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-6">
            Answer a few questions and our team will search every source —
            MLS, off-market, broker networks — and send you curated matches
            within 48 hours.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-[700px] mx-auto px-6 md:px-10">
          <DreamHomeFinder />
        </div>
      </section>
    </>
  );
}
