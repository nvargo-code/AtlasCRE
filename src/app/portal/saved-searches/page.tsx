"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SavedSearchItem {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  alertEnabled: boolean;
  alertFrequency: string;
  lastAlertAt: string | null;
  lastMatchCount: number;
  createdAt: string;
}

function formatFilterSummary(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  if (filters.searchMode) parts.push(String(filters.searchMode));
  if (filters.query) parts.push(`"${filters.query}"`);
  if (filters.market) parts.push(String(filters.market) === "austin" ? "Austin" : "DFW");
  if (filters.priceMax) parts.push(`Under $${(Number(filters.priceMax) / 1000).toFixed(0)}K`);
  if (filters.bedsMin) parts.push(`${filters.bedsMin}+ beds`);
  if (filters.bathsMin) parts.push(`${filters.bathsMin}+ baths`);
  if (filters.propertyType) {
    const types = Array.isArray(filters.propertyType) ? filters.propertyType : [filters.propertyType];
    parts.push(types.join(", "));
  }
  return parts.join(" · ") || "All listings";
}

function buildSearchUrl(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  if (filters.searchMode) params.set("searchMode", String(filters.searchMode));
  if (filters.query) params.set("q", String(filters.query));
  if (filters.market) params.set("market", String(filters.market));
  if (filters.priceMin) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax) params.set("priceMax", String(filters.priceMax));
  if (filters.bedsMin) params.set("bedsMin", String(filters.bedsMin));
  if (filters.bathsMin) params.set("bathsMin", String(filters.bathsMin));
  if (filters.propertyType) {
    const types = Array.isArray(filters.propertyType) ? filters.propertyType : [filters.propertyType];
    params.set("propertyType", types.join(","));
  }
  if (filters.listingType) {
    const types = Array.isArray(filters.listingType) ? filters.listingType : [filters.listingType];
    params.set("listingType", types.join(","));
  }
  return `/search?${params.toString()}`;
}

const FREQ_OPTIONS = [
  { value: "instant", label: "Instant" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "off", label: "Off" },
];

export default function SavedSearchesPortalPage() {
  const [searches, setSearches] = useState<SavedSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSearches(); }, []);

  async function loadSearches() {
    setLoading(true);
    const res = await fetch("/api/saved-searches");
    if (res.ok) {
      const data = await res.json();
      setSearches(Array.isArray(data) ? data : data.searches || []);
    }
    setLoading(false);
  }

  async function deleteSearch(id: string) {
    await fetch("/api/saved-searches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSearches(searches.filter((s) => s.id !== id));
  }

  async function updateAlertFrequency(id: string, frequency: string) {
    const enabled = frequency !== "off";
    await fetch("/api/saved-searches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, alertEnabled: enabled, alertFrequency: frequency }),
    });
    setSearches(searches.map((s) =>
      s.id === id ? { ...s, alertEnabled: enabled, alertFrequency: frequency } : s
    ));
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-navy">
            Saved <span className="font-semibold">Searches</span>
          </h1>
          <p className="text-mid-gray text-sm mt-1">
            Get notified when new listings match your criteria.
          </p>
        </div>
        <Link
          href="/search"
          className="bg-gold text-white px-4 py-2 text-[12px] font-semibold tracking-[0.1em] uppercase hover:bg-gold-dark transition-colors"
        >
          + New Search
        </Link>
      </div>

      {loading ? (
        <div className="text-mid-gray text-center py-16">Loading saved searches...</div>
      ) : searches.length === 0 ? (
        <div className="text-center py-16 bg-white border border-navy/10">
          <svg className="w-12 h-12 text-navy/10 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-navy mb-2">No saved searches</h3>
          <p className="text-mid-gray text-sm mb-4">
            Search for homes and tap &ldquo;Save Search&rdquo; to get notified of new matches.
          </p>
          <Link href="/search" className="bg-gold text-white px-6 py-2.5 text-sm font-semibold hover:bg-gold-dark inline-block">
            Start Searching
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => (
            <div key={search.id} className="bg-white border border-navy/10 p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Search Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-navy truncate">{search.name}</h3>
                    {search.lastMatchCount > 0 && (
                      <span className="text-[9px] font-semibold bg-gold/10 text-gold px-2 py-0.5 rounded flex-shrink-0">
                        {search.lastMatchCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-mid-gray">
                    {formatFilterSummary(search.filters)}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[11px] text-navy/30">
                      Saved {new Date(search.createdAt).toLocaleDateString()}
                    </p>
                    {search.lastAlertAt && (
                      <p className="text-[11px] text-navy/30">
                        Last alert: {new Date(search.lastAlertAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Alert Frequency */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <svg className="w-4 h-4 text-mid-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <div className="flex gap-0.5">
                    {FREQ_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateAlertFrequency(search.id, opt.value)}
                        className={`px-2 py-1 text-[10px] font-semibold tracking-[0.05em] uppercase transition-colors ${
                          (search.alertFrequency === opt.value || (!search.alertEnabled && opt.value === "off"))
                            ? opt.value === "off"
                              ? "bg-navy/10 text-navy/50"
                              : "bg-gold text-white"
                            : "bg-navy/5 text-navy/30 hover:text-navy/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={buildSearchUrl(search.filters)}
                    className="bg-gold text-white px-4 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase hover:bg-gold-dark transition-colors"
                  >
                    Run
                  </Link>
                  <button
                    onClick={() => deleteSearch(search.id)}
                    className="text-mid-gray hover:text-red-500 transition-colors p-2"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
