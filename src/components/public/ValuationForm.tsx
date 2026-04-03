"use client";

import { useState } from "react";

interface EstimateResult {
  estimatedValue: number;
  rangeLow: number;
  rangeHigh: number;
  avgPricePerSqft: number | null;
  compsUsed: number;
  confidence: "high" | "medium" | "low";
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export function ValuationForm() {
  const [step, setStep] = useState<"property" | "estimate" | "contact" | "success">("property");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);

  // Property fields
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [beds, setBeds] = useState("3");
  const [baths, setBaths] = useState("2");
  const [sqft, setSqft] = useState("");
  const [condition, setCondition] = useState("good");
  const [timeline, setTimeline] = useState("exploring");

  async function getEstimate() {
    if (!zip) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        zip,
        ...(address ? { address } : {}),
        ...(beds ? { beds } : {}),
        ...(baths ? { baths } : {}),
        ...(sqft ? { sqftMin: String(Number(sqft) * 0.8), sqftMax: String(Number(sqft) * 1.2) } : {}),
        radius: "1",
      });

      const res = await fetch(`/api/portal/cma?${params}`);
      if (res.ok) {
        const data = await res.json();
        const stats = data.stats;

        if (stats.medianPrice && stats.avgPrice) {
          const baseValue = (stats.medianPrice + stats.avgPrice) / 2;

          // Apply condition adjustment
          const conditionMultiplier =
            condition === "excellent" ? 1.05 :
            condition === "good" ? 1.0 :
            condition === "fair" ? 0.93 :
            0.85;

          // Sqft adjustment if provided
          let sqftAdjustment = 1.0;
          if (sqft && stats.avgPricePerSqft) {
            const userSqft = Number(sqft);
            const avgSqft = baseValue / stats.avgPricePerSqft;
            if (avgSqft > 0) {
              sqftAdjustment = 0.7 + 0.3 * (userSqft / avgSqft);
            }
          }

          const adjusted = baseValue * conditionMultiplier * sqftAdjustment;
          const confidence: "high" | "medium" | "low" =
            stats.compCount >= 10 ? "high" :
            stats.compCount >= 5 ? "medium" : "low";

          setEstimate({
            estimatedValue: Math.round(adjusted / 1000) * 1000,
            rangeLow: Math.round(adjusted * 0.92 / 1000) * 1000,
            rangeHigh: Math.round(adjusted * 1.08 / 1000) * 1000,
            avgPricePerSqft: stats.avgPricePerSqft,
            compsUsed: stats.compCount,
            confidence,
          });
          setStep("estimate");
        } else {
          // Not enough data — skip to contact form
          setStep("contact");
        }
      } else {
        setStep("contact");
      }
    } catch {
      setStep("contact");
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);

    const form = e.currentTarget;
    const data = {
      address,
      city: zip,
      beds,
      baths,
      sqft,
      condition,
      timeline,
      firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
      lastName: (form.elements.namedItem("lastName") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      source: "valuation_page",
      type: "seller",
      estimatedValue: estimate?.estimatedValue,
    };

    try {
      await fetch("/api/register-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // silently fail
    }

    setSending(false);
    setStep("success");
  }

  // ── STEP 1: Property Details ──
  if (step === "property") {
    return (
      <div className="space-y-5">
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">Property Address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors" />
        </div>

        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">ZIP Code</label>
          <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} required placeholder="78704" className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">Beds</label>
            <select value={beds} onChange={(e) => setBeds(e.target.value)} className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold bg-white">
              {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}{n===5?"+":""}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">Baths</label>
            <select value={baths} onChange={(e) => setBaths(e.target.value)} className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold bg-white">
              {[1,2,3,4].map((n) => <option key={n} value={n}>{n}{n===4?"+":""}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">Sqft</label>
            <input type="number" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="2,000" className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">Condition</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold bg-white">
            <option value="excellent">Excellent — move-in ready, recently updated</option>
            <option value="good">Good — well maintained, minor updates needed</option>
            <option value="fair">Fair — functional but dated, cosmetic work needed</option>
            <option value="needs-work">Needs work — significant repairs or renovation</option>
          </select>
        </div>

        <button
          onClick={getEstimate}
          disabled={!zip || loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            "Get Instant Estimate"
          )}
        </button>

        <p className="text-[11px] text-mid-gray text-center">
          Instant estimate powered by SuperSearch comp data. No login required.
        </p>
      </div>
    );
  }

  // ── STEP 2: Show Estimate ──
  if (step === "estimate" && estimate) {
    return (
      <div>
        {/* Estimate Display */}
        <div className="bg-navy p-8 text-center mb-6">
          <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-3">Estimated Value</p>
          <p className="text-white text-4xl md:text-5xl font-bold">{fmt(estimate.estimatedValue)}</p>
          <p className="text-white/40 text-sm mt-2">
            Range: {fmt(estimate.rangeLow)} — {fmt(estimate.rangeHigh)}
          </p>
          <div className="flex justify-center gap-4 mt-4">
            {estimate.avgPricePerSqft && (
              <span className="text-white/30 text-[11px]">${estimate.avgPricePerSqft}/SF avg</span>
            )}
            <span className="text-white/30 text-[11px]">{estimate.compsUsed} comps analyzed</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 ${
              estimate.confidence === "high" ? "bg-green-500/20 text-green-400" :
              estimate.confidence === "medium" ? "bg-gold/20 text-gold" :
              "bg-red-500/20 text-red-400"
            }`}>
              {estimate.confidence} confidence
            </span>
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-navy font-semibold mb-1">Want a detailed professional valuation?</p>
          <p className="text-mid-gray text-sm">
            Our team will analyze your property using off-market comps, hyperlocal adjustments,
            and strategic pricing insights that algorithms miss.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep("contact")}
            className="btn-primary flex-1"
          >
            Get Detailed Valuation
          </button>
          <button
            onClick={() => setStep("property")}
            className="btn-outline-dark flex-1"
          >
            Try Another Address
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 3: Contact Form ──
  if (step === "contact") {
    return (
      <div>
        {estimate && (
          <div className="bg-warm-gray p-4 mb-6 text-center">
            <p className="text-[11px] text-mid-gray">Your instant estimate</p>
            <p className="text-xl font-bold text-navy">{fmt(estimate.estimatedValue)}</p>
          </div>
        )}

        <p className="text-sm text-navy font-semibold mb-1">Get Your Free Professional Valuation</p>
        <p className="text-[12px] text-mid-gray mb-4">
          {estimate
            ? "We'll refine this estimate with off-market comp data and send a comprehensive report within 24 hours."
            : "We'll analyze your property and send a comprehensive valuation within 24 hours."
          }
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">Timeline</label>
            <select value={timeline} onChange={(e) => setTimeline(e.target.value)} name="timeline" className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold bg-white">
              <option value="asap">I want to sell now</option>
              <option value="3-months">In the next 3 months</option>
              <option value="6-months">In the next 6 months</option>
              <option value="exploring">Just exploring my options</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" type="text" required placeholder="First name" className="border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold" />
            <input name="lastName" type="text" required placeholder="Last name" className="border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold" />
          </div>
          <input name="email" type="email" required placeholder="Email" className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold" />
          <input name="phone" type="tel" placeholder="Phone (optional)" className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold" />

          <button type="submit" disabled={sending} className="btn-primary w-full disabled:opacity-50">
            {sending ? "Submitting..." : "Get My Free Valuation"}
          </button>

          <p className="text-[11px] text-mid-gray text-center">No obligation. No spam. Just a straight valuation.</p>
        </form>
      </div>
    );
  }

  // ── STEP 4: Success ──
  return (
    <div className="bg-warm-gray p-10 text-center">
      <div className="text-gold text-4xl mb-4">&#10003;</div>
      <h3 className="text-xl font-semibold text-navy mb-2">Request Received</h3>
      {estimate && (
        <p className="text-lg font-bold text-navy mb-3">
          Instant Estimate: {fmt(estimate.estimatedValue)}
        </p>
      )}
      <p className="text-mid-gray text-sm max-w-sm mx-auto">
        We&apos;ll analyze your property using SuperSearch&apos;s proprietary data — including off-market
        comps and hyperlocal adjustments — and send a comprehensive valuation within 24 hours.
      </p>
    </div>
  );
}
