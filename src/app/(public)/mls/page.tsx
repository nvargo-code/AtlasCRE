import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MLS Search | Official Austin MLS Listings | Shapiro Group",
  description: "Search the official Austin MLS (ABOR Matrix) for homes, condos, and land. Combined with SuperSearch for the most comprehensive property search in Austin.",
};

export default function MLSPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-24 pb-4 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-light text-white">
                  MLS <span className="font-semibold">Search</span>
                </h1>
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-gold bg-gold/10 px-2 py-0.5">
                  Official ABOR
                </span>
              </div>
              <p className="text-white/40 text-sm">
                Official Austin Board of Realtors MLS — powered by Matrix IDX
              </p>
            </div>
            <Link
              href="/search"
              className="hidden md:flex items-center gap-2 bg-gold text-white px-5 py-2.5 text-[12px] font-semibold tracking-[0.1em] uppercase hover:bg-gold-dark transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              SuperSearch
            </Link>
          </div>

          {/* Comparison bar */}
          <div className="flex items-center gap-6 mt-4 pb-4 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-white/50 text-[11px]">MLS — Official listings from ABOR Matrix</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold" />
              <Link href="/search" className="text-gold text-[11px] hover:text-gold-dark">
                SuperSearch — MLS + off-market + broker exclusive &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* IDX iframe */}
      <div style={{ height: "calc(100vh - 180px)", width: "100%" }}>
        <iframe
          src="https://matrix.abor.com/Matrix/public/IDX.aspx?idx=726afe7"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: "none" }}
          title="Austin MLS Search — ABOR Matrix IDX"
          allow="geolocation"
        />
      </div>

      {/* SuperSearch CTA */}
      <section className="bg-navy py-8">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">Want to see even more listings?</p>
              <p className="text-white/40 text-sm">
                SuperSearch aggregates MLS + off-market databases + broker-exclusive listings.
                See 15-30% more properties than MLS alone.
              </p>
            </div>
            <Link href="/search?searchMode=residential" className="btn-primary flex-shrink-0">
              Try SuperSearch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
