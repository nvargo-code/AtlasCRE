"use client";

import { useEffect, useState, useRef } from "react";

interface AreaStats {
  totalListings: number;
  avgPrice: number | null;
  medianPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  avgPricePerSqft: number | null;
  avgSqft: number | null;
}

interface AreaStatsPanelProps {
  bounds: { north: number; south: number; east: number; west: number } | null;
  searchMode: string;
}

function formatPrice(n: number | null): string {
  if (!n) return "—";
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

export function AreaStatsPanel({ bounds, searchMode }: AreaStatsPanelProps) {
  const [stats, setStats] = useState<AreaStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!bounds) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          north: bounds.north.toString(),
          south: bounds.south.toString(),
          east: bounds.east.toString(),
          west: bounds.west.toString(),
          searchMode,
        });
        const res = await fetch(`/api/stats?${params}`);
        if (res.ok) {
          setStats(await res.json());
        }
      } catch {
        // Silently fail
      }
      setLoading(false);
    }, 500); // Debounce 500ms after map stops moving
  }, [bounds, searchMode]);

  if (!stats && !loading) return null;

  return (
    <div className="absolute bottom-4 left-4 z-20">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="bg-white shadow-lg border border-navy/10 px-3 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-navy hover:text-gold transition-colors flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Area Stats
        <svg
          className={`w-3 h-3 transition-transform ${collapsed ? "" : "rotate-180"}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {!collapsed && stats && (
        <div className="bg-white shadow-lg border border-navy/10 mt-1 p-4 min-w-[240px]">
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-mid-gray">Listings</p>
              <p className="text-lg font-bold text-navy">{stats.totalListings}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-mid-gray">Median</p>
              <p className="text-lg font-bold text-navy">{formatPrice(stats.medianPrice)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-mid-gray">Avg $/SF</p>
              <p className="text-lg font-bold text-navy">
                {stats.avgPricePerSqft ? `$${stats.avgPricePerSqft}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-mid-gray">Avg SF</p>
              <p className="text-lg font-bold text-navy">
                {stats.avgSqft ? stats.avgSqft.toLocaleString() : "—"}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-navy/10 flex justify-between text-[10px] text-mid-gray">
            <span>Low: {formatPrice(stats.minPrice)}</span>
            <span>High: {formatPrice(stats.maxPrice)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
