import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { RevealSection } from "@/components/public/RevealSection";

export const metadata: Metadata = {
  title: "Recently Sold Homes in Austin | SuperSearch | Shapiro Group",
  description: "View recently sold homes in Austin. See sold prices, days on market, and market trends. SuperSearch tracks sold data from multiple sources.",
};

export const dynamic = "force-dynamic";

export default async function SoldPage() {
  let soldListings: {
    id: string; address: string; city: string; zip: string | null;
    priceAmount: number | null; beds: number | null; baths: number | null;
    buildingSf: number | null; imageUrl: string | null; updatedAt: Date;
    createdAt: Date;
  }[] = [];
  let soldCount = 0;

  try {
    [soldCount, soldListings] = await Promise.all([
      prisma.listing.count({ where: { status: "sold", searchMode: "residential" } }),
      prisma.listing.findMany({
        where: { status: "sold", searchMode: "residential" },
        select: {
          id: true, address: true, city: true, zip: true,
          priceAmount: true, beds: true, baths: true,
          buildingSf: true, imageUrl: true, updatedAt: true, createdAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 24,
      }),
    ]);
  } catch { /* fallback to empty */ }

  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">Market Data</p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">
            Recently <span className="font-semibold">Sold</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-xl mt-6">
            {soldCount > 0
              ? `${soldCount} properties recently sold in Austin. SuperSearch tracks sold data from multiple sources — including off-market sales.`
              : "Track recently sold properties in Austin with SuperSearch."}
          </p>
          <div className="mt-10">
            <Link href="/search?searchMode=residential" className="btn-primary">Search Active Listings</Link>
          </div>
        </div>
      </section>

      {soldListings.length > 0 && (
        <RevealSection className="section-padding bg-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10">
            <h2 className="text-2xl font-light text-navy mb-8 text-center">
              {soldCount} <span className="font-semibold">Sold Properties</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {soldListings.map((l) => {
                const dom = Math.floor((l.updatedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <Link key={l.id} href={`/listings/${l.id}`} className="group bg-white border border-navy/10 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] bg-navy/5 relative overflow-hidden">
                      {l.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.imageUrl} alt={l.address} className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-mid-gray text-sm">No Image</div>
                      )}
                      <span className="absolute top-3 left-3 bg-navy text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1">
                        Sold
                      </span>
                      {dom > 0 && (
                        <span className="absolute top-3 right-3 bg-white/90 text-navy text-[10px] font-semibold px-2 py-1">
                          {dom} DOM
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-lg font-semibold text-navy group-hover:text-gold transition-colors">
                        {l.priceAmount ? `$${Number(l.priceAmount).toLocaleString()}` : "Price N/A"}
                      </p>
                      <p className="text-sm text-navy/70 truncate">{l.address}</p>
                      <p className="text-[12px] text-mid-gray">{l.city} {l.zip}</p>
                      <div className="flex gap-3 mt-2 text-[12px] text-mid-gray">
                        {l.beds && <span>{l.beds} bed</span>}
                        {l.baths && <span>{Number(l.baths)} bath</span>}
                        {l.buildingSf && <span>{Number(l.buildingSf).toLocaleString()} SF</span>}
                      </div>
                      <p className="text-[11px] text-mid-gray mt-2">
                        Sold {l.updatedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </RevealSection>
      )}

      {soldListings.length === 0 && (
        <RevealSection className="section-padding bg-white">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
            <p className="text-mid-gray text-lg mb-6">Sold data is being compiled from multiple sources.</p>
            <Link href="/search" className="btn-primary">Search Active Listings</Link>
          </div>
        </RevealSection>
      )}

      <RevealSection className="section-padding bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 text-center">
          <h2 className="text-3xl font-light text-white mb-6">
            Better Comps. Better <span className="font-semibold">Decisions.</span>
          </h2>
          <p className="text-white/50 text-base max-w-md mx-auto mb-10">
            SuperSearch tracks sold data from MLS, broker networks, and off-market sources — giving you more comp data than any single portal.
          </p>
          <Link href="/valuation" className="btn-primary">Get Your Home Value</Link>
        </div>
      </RevealSection>
    </>
  );
}
