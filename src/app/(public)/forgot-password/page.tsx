"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"form" | "sent">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStep("sent");
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gray p-6">
      <div className="w-full max-w-md bg-white p-8 md:p-10 shadow-lg">
        {step === "form" ? (
          <>
            <Link href="/login" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark mb-6 inline-block">
              &larr; Back to Sign In
            </Link>
            <h1 className="text-2xl font-light text-navy mb-2">
              Reset <span className="font-semibold">Password</span>
            </h1>
            <p className="text-mid-gray text-sm mb-8">
              Enter your email and we&apos;ll send you a link to reset your password. If you registered via SuperSearch, you may need to set a password for the first time.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 mb-6 border border-red-200">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-navy mb-3">Check Your Email</h2>
            <p className="text-mid-gray text-sm mb-2">
              If an account exists for <strong className="text-navy">{email}</strong>, we&apos;ve sent password reset instructions.
            </p>
            <p className="text-mid-gray text-sm mb-8">
              If you don&apos;t see the email, check your spam folder or contact us at <a href="mailto:team@shapirogroup.co" className="text-gold">team@shapirogroup.co</a>.
            </p>
            <Link href="/login" className="btn-primary inline-block">
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
