"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const ONBOARDING_KEY = "shapiro_onboarding_complete";

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState({
    budget: "",
    beds: "",
    areas: [] as string[],
    timeline: "",
    type: "",
  });

  useEffect(() => {
    // Only show once
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  function complete() {
    localStorage.setItem(ONBOARDING_KEY, "true");
    // Save preferences to the activity API for recommendations
    fetch("/api/portal/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: "onboarding",
        action: "onboarding",
        metadata: prefs,
      }),
    }).catch(() => {});
    setShow(false);
  }

  function skip() {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShow(false);
  }

  if (!show) return null;

  const areas = [
    "Downtown", "78704 / South Austin", "Westlake", "East Austin",
    "Mueller / 78723", "Riverside", "Northwest Hills", "Cedar Park / Round Rock",
  ];

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center">
      <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <h2 className="text-2xl font-light text-navy mb-2">
        Welcome to <span className="font-semibold">SuperSearch</span>
      </h2>
      <p className="text-mid-gray text-sm max-w-sm mx-auto mb-6">
        Let&apos;s personalize your experience. Answer a few quick questions so we can
        show you the most relevant homes.
      </p>
      <button onClick={() => setStep(1)} className="btn-primary">
        Get Started
      </button>
      <button onClick={skip} className="block mx-auto mt-3 text-[12px] text-mid-gray hover:text-navy">
        Skip for now
      </button>
    </div>,

    // Step 1: Budget
    <div key="budget">
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gold mb-2">Step 1 of 4</p>
      <h3 className="text-xl font-semibold text-navy mb-4">What&apos;s your budget?</h3>
      <div className="grid grid-cols-2 gap-3">
        {["Under $400K", "$400K–$600K", "$600K–$800K", "$800K–$1M", "$1M–$1.5M", "$1.5M+"].map((b) => (
          <button
            key={b}
            onClick={() => setPrefs({ ...prefs, budget: b })}
            className={`p-3 text-sm border transition-colors ${
              prefs.budget === b ? "border-gold bg-gold/5 text-gold font-semibold" : "border-navy/10 text-navy hover:border-gold/30"
            }`}
          >
            {b}
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Size
    <div key="size">
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gold mb-2">Step 2 of 4</p>
      <h3 className="text-xl font-semibold text-navy mb-4">How many bedrooms?</h3>
      <div className="flex gap-3">
        {["1+", "2+", "3+", "4+", "5+"].map((b) => (
          <button
            key={b}
            onClick={() => setPrefs({ ...prefs, beds: b })}
            className={`flex-1 p-3 text-sm border transition-colors ${
              prefs.beds === b ? "border-gold bg-gold/5 text-gold font-semibold" : "border-navy/10 text-navy hover:border-gold/30"
            }`}
          >
            {b}
          </button>
        ))}
      </div>
    </div>,

    // Step 3: Areas
    <div key="areas">
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gold mb-2">Step 3 of 4</p>
      <h3 className="text-xl font-semibold text-navy mb-1">Where are you looking?</h3>
      <p className="text-mid-gray text-sm mb-4">Select all that interest you.</p>
      <div className="grid grid-cols-2 gap-2">
        {areas.map((a) => (
          <button
            key={a}
            onClick={() => {
              const next = prefs.areas.includes(a)
                ? prefs.areas.filter((x) => x !== a)
                : [...prefs.areas, a];
              setPrefs({ ...prefs, areas: next });
            }}
            className={`p-2.5 text-[13px] border transition-colors text-left ${
              prefs.areas.includes(a) ? "border-gold bg-gold/5 text-gold font-semibold" : "border-navy/10 text-navy hover:border-gold/30"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>,

    // Step 4: Timeline
    <div key="timeline">
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gold mb-2">Step 4 of 4</p>
      <h3 className="text-xl font-semibold text-navy mb-4">When are you looking to move?</h3>
      <div className="space-y-2">
        {["As soon as possible", "1–3 months", "3–6 months", "6–12 months", "Just exploring"].map((t) => (
          <button
            key={t}
            onClick={() => setPrefs({ ...prefs, timeline: t })}
            className={`w-full p-3 text-sm border transition-colors text-left ${
              prefs.timeline === t ? "border-gold bg-gold/5 text-gold font-semibold" : "border-navy/10 text-navy hover:border-gold/30"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>,
  ];

  const isLast = step === steps.length - 1;
  const canContinue = step === 0 || (step === 1 && prefs.budget) || (step === 2 && prefs.beds) || (step === 3 && prefs.areas.length > 0) || (step === 4 && prefs.timeline);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={skip} />
      <div className="relative bg-white w-full max-w-md shadow-2xl p-8">
        {/* Progress bar */}
        {step > 0 && (
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`flex-1 h-1 transition-colors ${s <= step ? "bg-gold" : "bg-navy/10"}`} />
            ))}
          </div>
        )}

        {steps[step]}

        {/* Navigation */}
        {step > 0 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(step - 1)}
              className="text-[12px] font-semibold text-mid-gray hover:text-navy"
            >
              &larr; Back
            </button>
            {isLast ? (
              <button onClick={complete} className="btn-primary">
                Start Searching
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canContinue}
                className="bg-gold text-white px-6 py-2 text-[12px] font-semibold hover:bg-gold-dark disabled:opacity-30"
              >
                Continue &rarr;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
