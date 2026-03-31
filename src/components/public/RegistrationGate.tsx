"use client";

import { useState } from "react";

interface RegistrationGateProps {
  advantage: number;
  onClose: () => void;
}

export function RegistrationGate({ advantage, onClose }: RegistrationGateProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);

    const form = e.currentTarget;
    const data = {
      firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
      lastName: (form.elements.namedItem("lastName") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      source: "supersearch_gate",
      context: `Clicked "See ${advantage} more listings" CTA`,
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-mid-gray hover:text-navy transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === "form" ? (
          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-1.5 text-[12px] font-semibold tracking-[0.12em] uppercase mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Exclusive Access
              </div>
              <h2 className="text-2xl font-light text-navy mb-2">
                <span className="font-bold text-gold">{advantage.toLocaleString()}</span> Properties.
                <span className="font-semibold"> Zero Public Portals.</span>
              </h2>
              <p className="text-mid-gray text-sm">
                These listings exist in off-market databases, broker networks, and
                luxury exclusives that Zillow and Realtor.com never see. Free account.
                Instant access.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="firstName"
                  type="text"
                  placeholder="First name"
                  required
                  className="border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                />
                <input
                  name="lastName"
                  type="text"
                  placeholder="Last name"
                  required
                  className="border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                />
              </div>
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
                {sending ? "Creating Account..." : "Unlock All Listings"}
              </button>

              <p className="text-[11px] text-mid-gray text-center">
                Free account. No credit card required. Unsubscribe anytime.
              </p>
            </form>
          </div>
        ) : (
          <div className="p-8 md:p-10 text-center">
            <div className="text-gold text-5xl mb-4">&#10003;</div>
            <h2 className="text-2xl font-semibold text-navy mb-3">You&apos;re In!</h2>
            <p className="text-mid-gray text-sm mb-6">
              Welcome to SuperSearch. You now have access to all{" "}
              <span className="font-semibold text-navy">{advantage.toLocaleString()}</span>{" "}
              exclusive listings. A member of our team will reach out shortly.
            </p>
            <button onClick={onClose} className="btn-primary">
              Start Browsing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
