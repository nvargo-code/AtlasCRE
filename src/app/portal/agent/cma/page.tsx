"use client";

import { useState } from "react";

interface CompListing {
  id: string;
  address: string;
  city: string;
  zip: string | null;
  priceAmount: number | null;
  buildingSf: number | null;
  lotSizeAcres: number | null;
  beds: number | null;
  baths: number | null;
  yearBuilt: number | null;
  propertyType: string;
  propSubType: string | null;
  listingType: string;
  status: string;
  imageUrl: string | null;
  pricePerSqft: number | null;
  distance: number | null;
  similarityScore: number;
}

interface CMAResult {
  subject: CompListing | null;
  comps: CompListing[];
  stats: {
    compCount: number;
    avgPrice: number | null;
    medianPrice: number | null;
    lowPrice: number | null;
    highPrice: number | null;
    avgPricePerSqft: number | null;
    medianPricePerSqft: number | null;
  };
  suggestedRange: { low: number | null; high: number | null };
}

function formatPrice(n: number | null): string {
  if (!n) return "—";
  return `$${n.toLocaleString()}`;
}

function formatPriceBrief(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

export default function CMAPage() {
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqftMin, setSqftMin] = useState("");
  const [sqftMax, setSqftMax] = useState("");
  const [radius, setRadius] = useState("1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CMAResult | null>(null);
  const [selectedComps, setSelectedComps] = useState<Set<string>>(new Set());

  async function runCMA() {
    if (!zip && !address) return;
    setLoading(true);
    setResult(null);
    setSelectedComps(new Set());

    const params = new URLSearchParams();
    if (address) params.set("address", address);
    if (zip) params.set("zip", zip);
    if (beds) params.set("beds", beds);
    if (baths) params.set("baths", baths);
    if (sqftMin) params.set("sqftMin", sqftMin);
    if (sqftMax) params.set("sqftMax", sqftMax);
    params.set("radius", radius);

    try {
      const res = await fetch(`/api/portal/cma?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        // Auto-select top 5 comps
        const topIds = data.comps.slice(0, 5).map((c: CompListing) => c.id);
        setSelectedComps(new Set(topIds));
      }
    } catch {
      // Handle error silently
    }
    setLoading(false);
  }

  function toggleComp(id: string) {
    setSelectedComps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Calculate stats from selected comps only
  const selectedCompData = result?.comps.filter((c) => selectedComps.has(c.id)) || [];
  const selectedPrices = selectedCompData.filter((c) => c.priceAmount).map((c) => c.priceAmount!);
  selectedPrices.sort((a, b) => a - b);
  const selectedPsf = selectedCompData.filter((c) => c.pricePerSqft).map((c) => c.pricePerSqft!);

  const selectedStats = {
    count: selectedCompData.length,
    avgPrice: selectedPrices.length > 0 ? Math.round(selectedPrices.reduce((a, b) => a + b, 0) / selectedPrices.length) : null,
    medianPrice: selectedPrices.length > 0 ? selectedPrices[Math.floor(selectedPrices.length / 2)] : null,
    lowPrice: selectedPrices[0] || null,
    highPrice: selectedPrices[selectedPrices.length - 1] || null,
    avgPsf: selectedPsf.length > 0 ? Math.round(selectedPsf.reduce((a, b) => a + b, 0) / selectedPsf.length) : null,
  };

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8 print:hidden">
        <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Agent Tools</p>
        <h1 className="text-2xl md:text-3xl font-light text-navy">
          Comparative Market <span className="font-semibold">Analysis</span>
        </h1>
        <p className="text-mid-gray text-sm mt-2">
          Find comps, compare properties, and generate pricing recommendations powered by SuperSearch data.
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white border border-navy/10 p-6 mb-8 print:hidden">
        <h2 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Subject Property</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">ZIP Code</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="78704"
              className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Beds</label>
            <input
              type="number"
              value={beds}
              onChange={(e) => setBeds(e.target.value)}
              placeholder="3"
              className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Baths</label>
            <input
              type="number"
              value={baths}
              onChange={(e) => setBaths(e.target.value)}
              placeholder="2"
              className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Min SF</label>
            <input
              type="number"
              value={sqftMin}
              onChange={(e) => setSqftMin(e.target.value)}
              placeholder="1500"
              className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Max SF</label>
            <input
              type="number"
              value={sqftMax}
              onChange={(e) => setSqftMax(e.target.value)}
              placeholder="2500"
              className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Radius (mi)</label>
            <select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors bg-white"
            >
              <option value="0.5">0.5 mi</option>
              <option value="1">1 mi</option>
              <option value="2">2 mi</option>
              <option value="3">3 mi</option>
              <option value="5">5 mi</option>
            </select>
          </div>
        </div>
        <button
          onClick={runCMA}
          disabled={loading || (!zip && !address)}
          className="bg-navy text-white px-8 py-3 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            "Run CMA"
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Print button */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <h2 className="text-lg font-semibold text-navy">CMA Results</h2>
            <button
              onClick={() => window.print()}
              className="bg-navy text-white px-5 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print CMA Report
            </button>
          </div>

          {/* Print header (only shows in print) */}
          <div className="hidden print:block mb-8">
            <div className="flex items-center justify-between border-b-2 border-navy pb-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-navy">Comparative Market Analysis</h1>
                <p className="text-mid-gray text-sm">{address || "Property Analysis"} &middot; {zip}</p>
              </div>
              <div className="text-right">
                <p className="text-navy font-semibold">Shapiro Group</p>
                <p className="text-[11px] text-mid-gray">Powered by SuperSearch</p>
              </div>
            </div>
          </div>

          {/* Subject Property */}
          {result.subject && (
            <div className="bg-gold/5 border border-gold/30 p-6 mb-6">
              <h2 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gold mb-3">Subject Property Found</h2>
              <div className="flex flex-col md:flex-row gap-6">
                {result.subject.imageUrl && (
                  <div className="w-full md:w-48 h-32 flex-shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.subject.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-navy">{result.subject.address}</h3>
                  <p className="text-mid-gray text-sm">{result.subject.city}, TX {result.subject.zip}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <span className="font-semibold text-navy">{formatPrice(result.subject.priceAmount)}</span>
                    {result.subject.beds && <span>{result.subject.beds} bed</span>}
                    {result.subject.baths && <span>{result.subject.baths} bath</span>}
                    {result.subject.buildingSf && <span>{result.subject.buildingSf.toLocaleString()} SF</span>}
                    {result.subject.pricePerSqft && <span>${result.subject.pricePerSqft}/SF</span>}
                    {result.subject.yearBuilt && <span>Built {result.subject.yearBuilt}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Valuation Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-navy/10 p-5">
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-mid-gray">Selected Comps</p>
              <p className="text-2xl font-bold text-navy mt-1">{selectedStats.count}</p>
            </div>
            <div className="bg-white border border-navy/10 p-5">
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-mid-gray">Median Price</p>
              <p className="text-2xl font-bold text-gold mt-1">{formatPriceBrief(selectedStats.medianPrice)}</p>
            </div>
            <div className="bg-white border border-navy/10 p-5">
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-mid-gray">Avg Price</p>
              <p className="text-2xl font-bold text-navy mt-1">{formatPriceBrief(selectedStats.avgPrice)}</p>
            </div>
            <div className="bg-white border border-navy/10 p-5">
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-mid-gray">Avg $/SF</p>
              <p className="text-2xl font-bold text-navy mt-1">{selectedStats.avgPsf ? `$${selectedStats.avgPsf}` : "—"}</p>
            </div>
          </div>

          {/* Suggested Value Range */}
          {selectedStats.medianPrice && selectedStats.avgPrice && (
            <div className="bg-navy p-6 mb-8">
              <h2 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gold mb-3">
                Suggested Value Range
              </h2>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-white/50 text-[11px] uppercase tracking-wider">Low</p>
                  <p className="text-white text-2xl font-bold">
                    {formatPriceBrief(Math.round(((selectedStats.medianPrice + selectedStats.avgPrice) / 2) * 0.95))}
                  </p>
                </div>
                <div className="flex-1 h-2 bg-white/10 relative mx-4">
                  <div className="absolute inset-y-0 left-[10%] right-[10%] bg-gold/60 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gold rounded-full" />
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-[11px] uppercase tracking-wider">High</p>
                  <p className="text-white text-2xl font-bold">
                    {formatPriceBrief(Math.round(((selectedStats.medianPrice + selectedStats.avgPrice) / 2) * 1.05))}
                  </p>
                </div>
              </div>
              <p className="text-white/30 text-[11px] mt-3">
                Based on {selectedStats.count} selected comps &middot; Range: {formatPriceBrief(selectedStats.lowPrice)} — {formatPriceBrief(selectedStats.highPrice)}
              </p>
            </div>
          )}

          {/* Comp List */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy">
              Comparable Properties ({result.comps.length})
            </h2>
            <p className="text-[11px] text-mid-gray">
              Click to select/deselect comps for analysis
            </p>
          </div>

          <div className="space-y-3">
            {result.comps.map((comp) => {
              const isSelected = selectedComps.has(comp.id);
              return (
                <button
                  key={comp.id}
                  onClick={() => toggleComp(comp.id)}
                  className={`w-full text-left bg-white border p-4 transition-all hover:shadow-md ${
                    isSelected ? "border-gold shadow-sm" : "border-navy/10"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Selection indicator */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "border-gold bg-gold" : "border-navy/20"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* Image */}
                    {comp.imageUrl && (
                      <div className="w-full md:w-24 h-20 flex-shrink-0 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={comp.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-navy text-sm truncate">{comp.address}</h3>
                        <span className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 flex-shrink-0 ${
                          comp.status === "active"
                            ? "bg-green-50 text-green-700"
                            : "bg-navy/5 text-navy/50"
                        }`}>
                          {comp.status}
                        </span>
                      </div>
                      <p className="text-mid-gray text-[12px]">{comp.city}, TX {comp.zip}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-[12px] text-navy/60">
                        {comp.beds && <span>{comp.beds} bed</span>}
                        {comp.baths && <span>{comp.baths} bath</span>}
                        {comp.buildingSf && <span>{comp.buildingSf.toLocaleString()} SF</span>}
                        {comp.yearBuilt && <span>Built {comp.yearBuilt}</span>}
                        {comp.distance != null && <span>{comp.distance} mi away</span>}
                      </div>
                    </div>

                    {/* Price & Score */}
                    <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-1 flex-shrink-0">
                      <p className="text-lg font-bold text-navy">{formatPrice(comp.priceAmount)}</p>
                      {comp.pricePerSqft && (
                        <p className="text-[11px] text-mid-gray">${comp.pricePerSqft}/SF</p>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-navy/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${comp.similarityScore}%`,
                              backgroundColor: comp.similarityScore >= 70 ? "#c9a96e" : comp.similarityScore >= 40 ? "#8a8f98" : "#ccc",
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-mid-gray font-semibold">{comp.similarityScore}%</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {result.comps.length === 0 && (
            <div className="bg-white border border-navy/10 p-12 text-center">
              <p className="text-mid-gray">No comparable properties found. Try adjusting your search criteria or expanding the radius.</p>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="bg-white border border-navy/10 p-16 text-center">
          <svg className="w-12 h-12 text-navy/15 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-navy mb-2">Run a Comparative Market Analysis</h3>
          <p className="text-mid-gray text-sm max-w-md mx-auto">
            Enter a subject property address or ZIP code to find comparable listings. SuperSearch pulls from MLS, off-market, and broker-exclusive sources — giving you more comp data than MLS alone.
          </p>
        </div>
      )}
    </div>
  );
}
