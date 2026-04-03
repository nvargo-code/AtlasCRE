"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";

interface CMAComp {
  address: string;
  city: string;
  priceAmount: number | null;
  buildingSf: number | null;
  beds: number | null;
  baths: number | null;
  yearBuilt: number | null;
  pricePerSqft: number | null;
  distance: number | null;
  similarityScore: number;
}

interface PresentationData {
  address: string;
  city: string;
  zip: string;
  beds: string;
  baths: string;
  sqft: string;
  yearBuilt: string;
  description: string;
  suggestedPrice: string;
  ownerName: string;
}

function formatPrice(n: number | null) {
  if (!n) return "—";
  return `$${n.toLocaleString()}`;
}

function formatPriceBrief(n: number | null) {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

export default function PresentationPage() {
  const { data: session } = useSession();
  const agentName = session?.user?.name || "Your Agent";
  const printRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<PresentationData>({
    address: "",
    city: "Austin",
    zip: "",
    beds: "",
    baths: "",
    sqft: "",
    yearBuilt: "",
    description: "",
    suggestedPrice: "",
    ownerName: "",
  });

  const [comps, setComps] = useState<CMAComp[]>([]);
  const [compStats, setCompStats] = useState<{
    avgPrice: number | null;
    medianPrice: number | null;
    avgPsf: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function fetchComps() {
    if (!form.zip) return;
    setLoading(true);
    const params = new URLSearchParams({
      zip: form.zip,
      ...(form.address ? { address: form.address } : {}),
      ...(form.beds ? { beds: form.beds } : {}),
      ...(form.baths ? { baths: form.baths } : {}),
      ...(form.sqft ? { sqftMin: String(Number(form.sqft) * 0.8), sqftMax: String(Number(form.sqft) * 1.2) } : {}),
      radius: "1",
    });

    try {
      const res = await fetch(`/api/portal/cma?${params}`);
      if (res.ok) {
        const data = await res.json();
        setComps(data.comps.slice(0, 5));
        setCompStats(data.stats);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }

  function generate() {
    fetchComps().then(() => setGenerated(true));
  }

  function handlePrint() {
    window.print();
  }

  const update = (field: keyof PresentationData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Agent Tools</p>
          <h1 className="text-2xl md:text-3xl font-light text-navy">
            Listing <span className="font-semibold">Presentation</span>
          </h1>
          <p className="text-mid-gray text-sm mt-2">
            Generate a professional listing presentation with market data and comps.
          </p>
        </div>
        {generated && (
          <button
            onClick={handlePrint}
            className="bg-navy text-white px-6 py-3 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90 transition-colors print:hidden"
          >
            Print / PDF
          </button>
        )}
      </div>

      {/* Input Form */}
      <div className="bg-white border border-navy/10 p-6 mb-8 print:hidden">
        <h2 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Property Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Owner Name</label>
            <input type="text" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} placeholder="John & Jane Smith" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Address</label>
            <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="123 Main St" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">City</label>
            <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">ZIP</label>
            <input type="text" value={form.zip} onChange={(e) => update("zip", e.target.value)} placeholder="78704" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Beds</label>
            <input type="number" value={form.beds} onChange={(e) => update("beds", e.target.value)} placeholder="3" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Baths</label>
            <input type="number" value={form.baths} onChange={(e) => update("baths", e.target.value)} placeholder="2" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Sqft</label>
            <input type="number" value={form.sqft} onChange={(e) => update("sqft", e.target.value)} placeholder="2000" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Year Built</label>
            <input type="number" value={form.yearBuilt} onChange={(e) => update("yearBuilt", e.target.value)} placeholder="2005" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Suggested List Price</label>
            <input type="text" value={form.suggestedPrice} onChange={(e) => update("suggestedPrice", e.target.value)} placeholder="$550,000" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Property Description</label>
            <input type="text" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Beautifully updated home..." className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading || !form.zip}
          className="bg-navy text-white px-8 py-3 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Presentation"}
        </button>
      </div>

      {/* Generated Presentation */}
      {generated && (
        <div ref={printRef} className="bg-white print:shadow-none">
          {/* Page 1: Cover */}
          <div className="bg-navy p-12 md:p-16 text-center print:break-after-page">
            <div className="mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logos/sg-horizontal-white.png" alt="Shapiro Group" className="h-10 mx-auto mb-6" />
            </div>
            <p className="text-gold text-[12px] font-semibold tracking-[0.3em] uppercase mb-6">
              Listing Presentation
            </p>
            <h2 className="text-3xl md:text-5xl font-light text-white leading-tight mb-4">
              {form.address || "Property Address"}
            </h2>
            <p className="text-white/50 text-lg">
              {form.city}, TX {form.zip}
            </p>
            {form.ownerName && (
              <p className="text-white/30 text-sm mt-6">
                Prepared for {form.ownerName}
              </p>
            )}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-white/40 text-sm">Presented by</p>
              <p className="text-gold text-lg font-semibold mt-1">{agentName}</p>
              <p className="text-white/40 text-sm">Shapiro Group</p>
            </div>
          </div>

          {/* Page 2: Property Details & Suggested Price */}
          <div className="p-12 md:p-16 border-b border-navy/10 print:break-after-page">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              Your Home
            </p>
            <h3 className="text-2xl md:text-3xl font-light text-navy mb-8">
              Property <span className="font-semibold">Details</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              {[
                { label: "Beds", value: form.beds || "—" },
                { label: "Baths", value: form.baths || "—" },
                { label: "Square Feet", value: form.sqft ? Number(form.sqft).toLocaleString() : "—" },
                { label: "Year Built", value: form.yearBuilt || "—" },
              ].map((item) => (
                <div key={item.label} className="border border-navy/10 p-5 text-center">
                  <p className="text-2xl font-bold text-navy">{item.value}</p>
                  <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            {form.description && (
              <p className="text-mid-gray text-base leading-relaxed mb-10">{form.description}</p>
            )}

            {/* Suggested Price */}
            {form.suggestedPrice && (
              <div className="bg-navy p-8 text-center">
                <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-3">
                  Recommended List Price
                </p>
                <p className="text-white text-4xl md:text-5xl font-bold">{form.suggestedPrice}</p>
                {compStats?.medianPrice && (
                  <p className="text-white/40 text-sm mt-3">
                    Comp median: {formatPriceBrief(compStats.medianPrice)} &middot; Avg $/SF: {compStats.avgPsf ? `$${compStats.avgPsf}` : "—"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Page 3: Comp Analysis */}
          {comps.length > 0 && (
            <div className="p-12 md:p-16 border-b border-navy/10 print:break-after-page">
              <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
                Market Analysis
              </p>
              <h3 className="text-2xl md:text-3xl font-light text-navy mb-8">
                Comparable <span className="font-semibold">Properties</span>
              </h3>

              {/* Comp summary */}
              {compStats && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-warm-gray p-5 text-center">
                    <p className="text-2xl font-bold text-navy">{formatPriceBrief(compStats.avgPrice)}</p>
                    <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Avg Price</p>
                  </div>
                  <div className="bg-warm-gray p-5 text-center">
                    <p className="text-2xl font-bold text-gold">{formatPriceBrief(compStats.medianPrice)}</p>
                    <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Median Price</p>
                  </div>
                  <div className="bg-warm-gray p-5 text-center">
                    <p className="text-2xl font-bold text-navy">{compStats.avgPsf ? `$${compStats.avgPsf}` : "—"}</p>
                    <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Avg $/SF</p>
                  </div>
                </div>
              )}

              {/* Comp table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-navy">
                      <th className="text-left py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-navy">Address</th>
                      <th className="text-right py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-navy">Price</th>
                      <th className="text-right py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-navy">Beds</th>
                      <th className="text-right py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-navy">Baths</th>
                      <th className="text-right py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-navy">Sqft</th>
                      <th className="text-right py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-navy">$/SF</th>
                      <th className="text-right py-3 text-[11px] font-semibold tracking-[0.1em] uppercase text-navy">Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comps.map((comp, i) => (
                      <tr key={i} className="border-b border-navy/10">
                        <td className="py-3 text-navy font-medium">{comp.address}<br /><span className="text-[11px] text-mid-gray">{comp.city}</span></td>
                        <td className="py-3 text-right font-semibold text-navy">{formatPrice(comp.priceAmount)}</td>
                        <td className="py-3 text-right text-mid-gray">{comp.beds ?? "—"}</td>
                        <td className="py-3 text-right text-mid-gray">{comp.baths ?? "—"}</td>
                        <td className="py-3 text-right text-mid-gray">{comp.buildingSf?.toLocaleString() ?? "—"}</td>
                        <td className="py-3 text-right text-mid-gray">{comp.pricePerSqft ? `$${comp.pricePerSqft}` : "—"}</td>
                        <td className="py-3 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 ${
                            comp.similarityScore >= 70 ? "bg-green-50 text-green-700" :
                            comp.similarityScore >= 40 ? "bg-amber-50 text-amber-700" :
                            "bg-red-50 text-red-600"
                          }`}>{comp.similarityScore}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Page 4: Why Shapiro Group */}
          <div className="p-12 md:p-16 print:break-after-page">
            <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
              Our Advantage
            </p>
            <h3 className="text-2xl md:text-3xl font-light text-navy mb-8">
              Why <span className="font-semibold">Shapiro Group</span>
            </h3>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {[
                {
                  title: "SuperSearch Technology",
                  desc: "Our proprietary platform aggregates listings from MLS, off-market databases, and broker-exclusive sources. We show buyers more listings than Zillow — which means more potential buyers see your home.",
                },
                {
                  title: "Multi-Source Marketing",
                  desc: "Your listing appears across MLS, Zillow, Realtor.com, social media, email campaigns, and our exclusive buyer network. Maximum exposure from day one.",
                },
                {
                  title: "Data-Driven Pricing",
                  desc: "Our CMA tool pulls comparable sales from more sources than traditional MLS-only analysis, giving you a more accurate picture of your home's true market value.",
                },
                {
                  title: "White-Glove Service",
                  desc: "From professional photography and staging consultation to negotiation strategy and closing coordination — we handle every detail so you don't have to.",
                },
              ].map((item) => (
                <div key={item.title} className="border border-navy/10 p-6">
                  <h4 className="font-semibold text-navy mb-2">{item.title}</h4>
                  <p className="text-mid-gray text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Agent card */}
            <div className="bg-navy p-8 flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center text-gold text-2xl font-bold flex-shrink-0">
                {agentName[0]}
              </div>
              <div>
                <p className="text-white text-xl font-semibold">{agentName}</p>
                <p className="text-white/50 text-sm">Shapiro Group</p>
                <p className="text-gold text-sm mt-1">{session?.user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
