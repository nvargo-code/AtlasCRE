"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");

    const form = e.currentTarget;
    const data = {
      firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
      lastName: (form.elements.namedItem("lastName") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      interest: (form.elements.namedItem("interest") as HTMLSelectElement).value,
      source: "website_registration",
    };

    try {
      const res = await fetch("/api/register-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to register");
      setStep("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col justify-between p-16">
        <div>
          <Link href="/" className="block h-10 w-[200px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logos/sg-horizontal-white.png" alt="Shapiro Group" className="h-full w-auto object-contain" />
          </Link>
        </div>

        <div>
          <h2 className="text-3xl font-light text-white leading-tight mb-6">
            Access More Listings<br />
            <span className="font-semibold">Than Zillow</span>
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-md mb-8">
            Create a free account to unlock SuperSearch — our proprietary engine
            that aggregates listings from MLS, off-market databases, and
            broker-exclusive sources.
          </p>
          <div className="space-y-4">
            {[
              "See 235+ more listings than Zillow",
              "Save searches and get instant alerts",
              "Access off-market and pocket listings",
              "Connect directly with our agents",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/70 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-[11px]">
          &copy; {new Date().getFullYear()} Vivid Acres LLC DBA Shapiro Real Estate Group
        </p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-16 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <Link href="/" className="block h-10 w-[200px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logos/sg-horizontal-black.png" alt="Shapiro Group" className="h-full w-auto object-contain" />
            </Link>
          </div>

          {step === "form" ? (
            <>
              <h1 className="text-2xl md:text-3xl font-light text-navy mb-2">
                Create Your <span className="font-semibold">Account</span>
              </h1>
              <p className="text-mid-gray text-sm mb-8">
                Free access to SuperSearch. No credit card required.
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 mb-6 border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                      First Name
                    </label>
                    <input
                      name="firstName"
                      type="text"
                      required
                      className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
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
                      className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
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
                    className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                    Phone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                    I&apos;m Looking To
                  </label>
                  <select
                    name="interest"
                    className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                  >
                    <option value="buy">Buy a Home</option>
                    <option value="sell">Sell a Home</option>
                    <option value="invest">Invest in Property</option>
                    <option value="browse">Just Browsing</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {sending ? "Creating Account..." : "Create Free Account"}
                </button>
              </form>

              <p className="text-center text-mid-gray text-sm mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-gold hover:text-gold-dark font-medium">
                  Sign In
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-navy mb-3">Welcome!</h2>
              <p className="text-mid-gray text-sm mb-8">
                Your account has been created. A member of our team will reach
                out shortly. In the meantime, start exploring.
              </p>
              <Link href="/search" className="btn-primary">
                Start Searching
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
