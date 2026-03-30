"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"residential" | "commercial">("residential");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("searchMode", mode);
    if (query) params.set("q", query);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {/* Mode tabs */}
      <div className="flex gap-0 mb-0">
        {(["residential", "commercial"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-6 py-2.5 text-[12px] font-semibold tracking-[0.12em] uppercase transition-all duration-300 ${
              mode === m
                ? "bg-white text-navy"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Address, ZIP, neighborhood, or city..."
            className="w-full bg-white text-navy px-6 py-4 md:py-5 text-sm md:text-base placeholder:text-navy/40 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-gold hover:bg-gold-dark text-white px-8 md:px-12 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden md:inline text-[13px] font-semibold tracking-[0.1em] uppercase">
            Search
          </span>
        </button>
      </div>
    </form>
  );
}
