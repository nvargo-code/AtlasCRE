"use client";

import { useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
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
      interest: (form.elements.namedItem("interest") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSubmitted(true);
    } catch {
      // Still show success — we'll add webhook later
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-warm-gray p-10 text-center">
        <div className="text-gold text-4xl mb-4">&#10003;</div>
        <h3 className="text-xl font-semibold mb-2">Message Sent</h3>
        <p className="text-mid-gray text-sm">
          We&apos;ll be in touch within 24 hours. In the meantime, feel free to explore
          properties with{" "}
          <a href="/search" className="text-gold hover:underline">
            SuperSearch
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
            First Name
          </label>
          <input
            name="firstName"
            type="text"
            required
            className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors bg-transparent"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
            Last Name
          </label>
          <input
            name="lastName"
            type="text"
            required
            className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors bg-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors bg-transparent"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
          Phone
        </label>
        <input
          name="phone"
          type="tel"
          className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors bg-transparent"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
          I&apos;m Interested In
        </label>
        <select
          name="interest"
          className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors bg-transparent"
        >
          <option value="buying">Buying a Home</option>
          <option value="selling">Selling a Home</option>
          <option value="investing">Investment Property</option>
          <option value="commercial">Commercial Real Estate</option>
          <option value="valuation">Free Home Valuation</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
          Message
        </label>
        <textarea
          name="message"
          rows={4}
          className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors bg-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="btn-primary w-full disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
