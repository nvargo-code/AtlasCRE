"use client";

import { useState } from "react";

export function ValuationForm() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);

    const form = e.currentTarget;
    const data = {
      address: (form.elements.namedItem("address") as HTMLInputElement).value,
      city: (form.elements.namedItem("city") as HTMLInputElement).value,
      beds: (form.elements.namedItem("beds") as HTMLSelectElement).value,
      baths: (form.elements.namedItem("baths") as HTMLSelectElement).value,
      condition: (form.elements.namedItem("condition") as HTMLSelectElement).value,
      timeline: (form.elements.namedItem("timeline") as HTMLSelectElement).value,
      firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
      lastName: (form.elements.namedItem("lastName") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      source: "valuation_page",
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
    setStep("success");
  }

  if (step === "success") {
    return (
      <div className="bg-warm-gray p-10 text-center">
        <div className="text-gold text-4xl mb-4">&#10003;</div>
        <h3 className="text-xl font-semibold text-navy mb-2">Request Received</h3>
        <p className="text-mid-gray text-sm max-w-sm mx-auto">
          We&apos;ll analyze your property and send a comprehensive valuation within
          24 hours. If we need any additional details, we&apos;ll reach out.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
          Property Address
        </label>
        <input
          name="address"
          type="text"
          required
          placeholder="123 Main St"
          className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
          City / ZIP
        </label>
        <input
          name="city"
          type="text"
          required
          placeholder="Austin, TX 78704"
          className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
            Bedrooms
          </label>
          <select
            name="beds"
            className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3" selected>3</option>
            <option value="4">4</option>
            <option value="5">5+</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
            Bathrooms
          </label>
          <select
            name="baths"
            className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
          >
            <option value="1">1</option>
            <option value="2" selected>2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
          Condition
        </label>
        <select
          name="condition"
          className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
        >
          <option value="excellent">Excellent — move-in ready, recently updated</option>
          <option value="good">Good — well maintained, minor updates needed</option>
          <option value="fair">Fair — functional but dated, needs cosmetic work</option>
          <option value="needs-work">Needs work — significant repairs or renovation</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
          Timeline
        </label>
        <select
          name="timeline"
          className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
        >
          <option value="asap">I want to sell now</option>
          <option value="3-months">In the next 3 months</option>
          <option value="6-months">In the next 6 months</option>
          <option value="exploring">Just exploring my options</option>
        </select>
      </div>

      <div className="border-t border-navy/10 pt-5">
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-4">
          Your Contact Info
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            name="firstName"
            type="text"
            required
            placeholder="First name"
            className="border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
          />
          <input
            name="lastName"
            type="text"
            required
            placeholder="Last name"
            className="border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors mb-4"
        />
        <input
          name="phone"
          type="tel"
          placeholder="Phone (optional)"
          className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="btn-primary w-full disabled:opacity-50"
      >
        {sending ? "Submitting..." : "Get My Free Valuation"}
      </button>

      <p className="text-[11px] text-mid-gray text-center">
        No obligation. No spam. Just a straight valuation.
      </p>
    </form>
  );
}
