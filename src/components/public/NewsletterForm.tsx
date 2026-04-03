"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setError(false);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }

    setSending(false);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-gold text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        You&apos;re in. Watch your inbox.
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-0">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          className="flex-1 bg-white/5 border border-white/20 px-5 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-gold text-white px-8 py-3.5 text-[12px] font-semibold tracking-[0.12em] uppercase hover:bg-gold-dark transition-colors whitespace-nowrap disabled:opacity-50"
        >
          {sending ? "..." : "Subscribe"}
        </button>
      </form>
      {error && (
        <p className="text-red-400 text-[11px] mt-2">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}
