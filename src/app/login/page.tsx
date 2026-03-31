"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
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
          <h2 className="text-3xl font-light text-white leading-tight mb-4">
            Agent <span className="font-semibold">Dashboard</span>
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-md">
            Access the full AtlasCRE platform — map search, listing management,
            favorites, saved searches, and admin tools.
          </p>
        </div>

        <p className="text-white/20 text-[11px]">
          &copy; {new Date().getFullYear()} Shapiro Real Estate Group
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

          <h1 className="text-2xl md:text-3xl font-light text-navy mb-2">
            Agent <span className="font-semibold">Login</span>
          </h1>
          <p className="text-mid-gray text-sm mb-8">
            Sign in to access the AtlasCRE dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-navy/10 text-center">
            <p className="text-mid-gray text-sm">
              Looking for homes?{" "}
              <Link href="/search" className="text-gold hover:text-gold-dark font-medium">
                Search Properties
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
