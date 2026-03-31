"use client";

import { useState } from "react";

interface SaveSearchAlertProps {
  searchCriteria: Record<string, string | number | undefined>;
  onClose: () => void;
}

export function SaveSearchAlert({ searchCriteria, onClose }: SaveSearchAlertProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);

    const form = e.currentTarget;
    const data = {
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      source: "saved_search_alert",
      searchCriteria,
    };

    try {
      await fetch("/api/register-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // Will add webhook later
    }

    setSending(false);
    setStep("success");
  }

  // Format search criteria for display
  const criteriaDisplay = Object.entries(searchCriteria)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => {
      const labels: Record<string, string> = {
        searchMode: "Type", q: "Location", priceMax: "Max Price",
        bedsMin: "Min Beds", bathsMin: "Min Baths",
      };
      return { label: labels[k] || k, value: String(v) };
    });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-mid-gray hover:text-navy transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === "form" ? (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-navy mb-2">
              Get Alerts for New Matches
            </h2>
            <p className="text-mid-gray text-sm mb-4">
              We&apos;ll notify you when new listings match your search — including
              off-market properties only SuperSearch finds.
            </p>

            {/* Search criteria summary */}
            {criteriaDisplay.length > 0 && (
              <div className="bg-warm-gray p-4 mb-6">
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                  Your Search
                </p>
                <div className="flex flex-wrap gap-2">
                  {criteriaDisplay.map((c) => (
                    <span
                      key={c.label}
                      className="text-[11px] bg-white text-navy px-2.5 py-1 border border-navy/10"
                    >
                      {c.label}: {c.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="firstName"
                type="text"
                placeholder="First name"
                required
                className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
              />
              <input
                name="email"
                type="email"
                placeholder="Email address"
                required
                className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
              />
              <input
                name="phone"
                type="tel"
                placeholder="Phone (optional)"
                className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
              />
              <button
                type="submit"
                disabled={sending}
                className="btn-primary w-full disabled:opacity-50"
              >
                {sending ? "Saving..." : "Save Search & Get Alerts"}
              </button>
              <p className="text-[11px] text-mid-gray text-center">
                Free alerts. Unsubscribe anytime.
              </p>
            </form>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-gold text-4xl mb-4">&#10003;</div>
            <h2 className="text-xl font-semibold text-navy mb-2">Alerts Saved!</h2>
            <p className="text-mid-gray text-sm mb-6">
              You&apos;ll get notified when new listings match your search.
              A member of our team may also reach out to help.
            </p>
            <button onClick={onClose} className="btn-primary">
              Continue Browsing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
