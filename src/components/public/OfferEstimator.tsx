"use client";

import { useState, useEffect } from "react";

interface OfferEstimatorProps {
  listingId: string;
  listPrice: number;
  address: string;
  zip: string | null;
  daysOnMarket: number;
}

interface OfferData {
  lowOffer: number;
  midOffer: number;
  highOffer: number;
  confidence: string;
  reasoning: string[];
  strategy: string;
  hotScore: number | null;
}

export function OfferEstimator({ listingId, listPrice, address, zip, daysOnMarket }: OfferEstimatorProps) {
  const [data, setData] = useState<OfferData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    if (data) return;
    calculateOffer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  async function calculateOffer() {
    setLoading(true);

    // Fetch hot score and area stats
    const [hotRes, statsRes] = await Promise.all([
      fetch(`/api/portal/hot-score/${listingId}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      zip
        ? fetch(`/api/stats?searchMode=residential`).then((r) => r.ok ? r.json() : null).catch(() => null)
        : null,
    ]);

    const hotScore = hotRes?.score ?? 50;
    const areaMedian = statsRes?.medianPrice ?? listPrice;
    const priceVsArea = areaMedian > 0 ? ((listPrice - areaMedian) / areaMedian) * 100 : 0;

    // Calculate offer range based on signals
    const reasoning: string[] = [];
    let adjustmentPercent = 0;

    // Hot Score factor
    if (hotScore >= 80) {
      adjustmentPercent += 3;
      reasoning.push(`High demand (Hot Score ${hotScore}/100) — expect competition, offer at or above asking`);
    } else if (hotScore >= 60) {
      adjustmentPercent += 1;
      reasoning.push(`Moderate demand (Hot Score ${hotScore}/100) — competitive but room for a strategic offer`);
    } else if (hotScore >= 40) {
      adjustmentPercent -= 2;
      reasoning.push(`Average demand (Hot Score ${hotScore}/100) — negotiate from a position of some strength`);
    } else {
      adjustmentPercent -= 5;
      reasoning.push(`Low demand (Hot Score ${hotScore}/100) — significant negotiating leverage`);
    }

    // Days on market factor
    if (daysOnMarket <= 7) {
      adjustmentPercent += 2;
      reasoning.push(`Only ${daysOnMarket} days on market — new listing, seller has leverage`);
    } else if (daysOnMarket <= 14) {
      adjustmentPercent += 1;
      reasoning.push(`${daysOnMarket} days on market — still fresh, moderate urgency`);
    } else if (daysOnMarket <= 30) {
      reasoning.push(`${daysOnMarket} days on market — normal timeline`);
    } else if (daysOnMarket <= 60) {
      adjustmentPercent -= 3;
      reasoning.push(`${daysOnMarket} days on market — seller may be motivated`);
    } else {
      adjustmentPercent -= 6;
      reasoning.push(`${daysOnMarket} days on market — extended time, seller likely motivated to deal`);
    }

    // Price vs area factor
    if (priceVsArea < -10) {
      adjustmentPercent += 3;
      reasoning.push(`Priced ${Math.abs(Math.round(priceVsArea))}% below area median — potential value, may get multiple offers`);
    } else if (priceVsArea < -5) {
      adjustmentPercent += 1;
      reasoning.push(`Priced ${Math.abs(Math.round(priceVsArea))}% below area median — well-priced`);
    } else if (priceVsArea > 10) {
      adjustmentPercent -= 4;
      reasoning.push(`Priced ${Math.round(priceVsArea)}% above area median — room to negotiate down`);
    } else if (priceVsArea > 5) {
      adjustmentPercent -= 2;
      reasoning.push(`Priced ${Math.round(priceVsArea)}% above area median — slightly aggressive pricing`);
    }

    // Calculate ranges
    const midPercent = Math.max(-10, Math.min(5, adjustmentPercent));
    const midOffer = Math.round(listPrice * (1 + midPercent / 100));
    const lowOffer = Math.round(listPrice * (1 + (midPercent - 4) / 100));
    const highOffer = Math.round(listPrice * (1 + (midPercent + 2) / 100));

    // Strategy recommendation
    let strategy: string;
    if (adjustmentPercent >= 3) {
      strategy = "This home is likely to move fast. To win, consider offering at or above asking with strong terms — minimal contingencies, flexible closing date, and proof of funds or pre-approval letter.";
    } else if (adjustmentPercent >= 0) {
      strategy = "A competitive offer near asking price is reasonable. Focus on clean terms: strong financing, reasonable inspection timeline, and a personal letter if the seller accepts them.";
    } else if (adjustmentPercent >= -3) {
      strategy = "You have some negotiating room. Start slightly below asking and be prepared to negotiate. Include standard contingencies — you have leverage.";
    } else {
      strategy = "The data suggests significant negotiating leverage. Consider a lower initial offer with room to come up. The seller may be motivated to make a deal.";
    }

    const confidence = hotScore >= 60 ? "High" : hotScore >= 30 ? "Medium" : "Low";

    setData({ lowOffer, midOffer, highOffer, confidence, reasoning, strategy, hotScore });
    setLoading(false);
  }

  function formatPrice(n: number): string {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    return `$${n.toLocaleString()}`;
  }

  return (
    <div className="bg-warm-gray border-l-2 border-gold">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-base font-semibold text-navy">Offer Estimator</h3>
          <p className="text-[12px] text-mid-gray">What should you offer on this home?</p>
        </div>
        <svg
          className={`w-5 h-5 text-gold transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {loading ? (
            <div className="text-mid-gray text-sm py-4 text-center">Analyzing market data...</div>
          ) : data ? (
            <div className="space-y-4">
              {/* Offer range */}
              <div className="bg-white p-4">
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mb-3">
                  Suggested Offer Range
                </p>
                <div className="flex items-end justify-between mb-2">
                  <div className="text-center">
                    <p className="text-sm text-mid-gray">Conservative</p>
                    <p className="text-lg font-bold text-navy">{formatPrice(data.lowOffer)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gold font-semibold">Recommended</p>
                    <p className="text-2xl font-bold text-gold">{formatPrice(data.midOffer)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-mid-gray">Aggressive</p>
                    <p className="text-lg font-bold text-navy">{formatPrice(data.highOffer)}</p>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="relative h-2 bg-navy/10 rounded-full mt-3">
                  <div
                    className="absolute h-full bg-gradient-to-r from-navy/30 via-gold to-navy/30 rounded-full"
                    style={{
                      left: `${Math.max(0, ((data.lowOffer / listPrice) - 0.9) * 1000)}%`,
                      right: `${Math.max(0, (1.1 - (data.highOffer / listPrice)) * 1000)}%`,
                    }}
                  />
                  <div
                    className="absolute w-1 h-4 bg-navy -top-1"
                    style={{ left: "50%" }}
                    title={`List: ${formatPrice(listPrice)}`}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-mid-gray">
                  <span>{Math.round((data.lowOffer / listPrice) * 100)}% of ask</span>
                  <span>List: {formatPrice(listPrice)}</span>
                  <span>{Math.round((data.highOffer / listPrice) * 100)}% of ask</span>
                </div>
              </div>

              {/* Strategy */}
              <div className="bg-white p-4">
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mb-2">
                  Strategy
                </p>
                <p className="text-sm text-navy leading-relaxed">{data.strategy}</p>
              </div>

              {/* Reasoning */}
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mb-2">
                  Why This Range
                </p>
                <ul className="space-y-1.5">
                  {data.reasoning.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-mid-gray">
                      <span className="text-gold mt-0.5">&#8226;</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confidence */}
              <p className="text-[10px] text-mid-gray italic">
                Confidence: {data.confidence} &middot; Based on Hot Score, days on market, and area pricing.
                This is an estimate — your agent can refine it based on property-specific factors.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
