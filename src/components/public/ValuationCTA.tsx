"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const DISMISS_KEY = "valuation_cta_dismissed";

export function ValuationCTA() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start dismissed, check localStorage
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Don't show on search page
    if (pathname === "/search") return;

    // Check if previously dismissed
    const wasDismissed = localStorage.getItem(DISMISS_KEY);
    if (wasDismissed) return;

    setDismissed(false);

    // Show after 15 seconds on page
    const timer = setTimeout(() => setVisible(true), 15000);
    return () => clearTimeout(timer);
  }, [pathname]);

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  }

  if (dismissed || !visible) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);

    const form = e.currentTarget;
    const data = {
      address: (form.elements.namedItem("address") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      source: "home_valuation_cta",
    };

    try {
      await fetch("/api/register-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // Webhook later
    }

    setSending(false);
    setSubmitted(true);
    setTimeout(() => handleDismiss(), 3000);
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[340px] bg-white shadow-2xl border border-navy/10 animate-fade-in-up">
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-mid-gray hover:text-navy transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {!submitted ? (
        <div className="p-6">
          <div className="bg-gold/10 text-gold text-[11px] font-semibold tracking-[0.15em] uppercase px-3 py-1 inline-block mb-3">
            Free Valuation
          </div>
          <h3 className="text-lg font-semibold text-navy mb-1">
            What&apos;s Your Home Worth?
          </h3>
          <p className="text-mid-gray text-[13px] mb-4">
            Get a complimentary market analysis from our team.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              name="address"
              type="text"
              placeholder="Your property address"
              required
              className="w-full border border-navy/15 px-3 py-2.5 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="w-full border border-navy/15 px-3 py-2.5 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
            />
            <input
              name="phone"
              type="tel"
              placeholder="Phone (optional)"
              className="w-full border border-navy/15 px-3 py-2.5 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
            />
            <button
              type="submit"
              disabled={sending}
              className="btn-primary w-full text-[12px] py-2.5 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Get Free Valuation"}
            </button>
          </form>
        </div>
      ) : (
        <div className="p-6 text-center">
          <div className="text-gold text-3xl mb-2">&#10003;</div>
          <p className="text-navy font-semibold text-sm">Request Received!</p>
          <p className="text-mid-gray text-[12px] mt-1">
            We&apos;ll be in touch within 24 hours.
          </p>
        </div>
      )}
    </div>
  );
}
