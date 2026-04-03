"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface TrendBucket {
  month: string;
  label: string;
  medianPrice: number | null;
  avgPrice: number | null;
  avgPricePerSqft: number | null;
  activeListings: number;
  newListings: number;
  priceChanges: number;
}

interface MarketSummary {
  totalListings: number;
  medianPrice: number | null;
  avgPrice: number | null;
  totalNewListings: number;
  totalPriceChanges: number;
  zips: string[];
  period: string;
}

interface MarketData {
  summary: MarketSummary;
  trends: TrendBucket[];
}

interface MarketDashboardProps {
  zips: string[];
  neighborhoodName: string;
  searchMode?: string;
}

type ChartView = "price" | "inventory" | "priceSqft";
type TimeRange = "6" | "12" | "24";

function formatPrice(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function formatTooltipValue(value: unknown) {
  if (typeof value !== "number") return "—";
  return `$${value.toLocaleString()}`;
}

const NAVY = "#0a1628";
const GOLD = "#c9a96e";
const GOLD_LIGHT = "rgba(201,169,110,0.15)";
const MID_GRAY = "#8a8f98";

export function MarketDashboard({ zips, neighborhoodName, searchMode = "residential" }: MarketDashboardProps) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<ChartView>("price");
  const [timeRange, setTimeRange] = useState<TimeRange>("12");

  useEffect(() => {
    async function fetchTrends() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          zips: zips.join(","),
          months: timeRange,
          searchMode,
        });
        const res = await fetch(`/api/market-trends?${params}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Silently fail
      }
      setLoading(false);
    }
    fetchTrends();
  }, [zips, timeRange, searchMode]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-mid-gray text-sm">Loading market data...</p>
      </div>
    );
  }

  if (!data || data.trends.length === 0) return null;

  const { summary, trends } = data;

  // Filter out months with no data for cleaner charts
  const chartData = trends.filter(
    (t) => t.medianPrice || t.newListings > 0 || t.activeListings > 0
  );

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <SummaryCard label="Active Listings" value={summary.totalListings.toString()} />
        <SummaryCard label="Median Price" value={formatPrice(summary.medianPrice)} />
        <SummaryCard label="New Listings" value={summary.totalNewListings.toString()} subtitle={`past ${timeRange}mo`} />
        <SummaryCard label="Price Changes" value={summary.totalPriceChanges.toString()} subtitle={`past ${timeRange}mo`} />
      </div>

      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-1">
          {([
            ["price", "Price Trends"],
            ["inventory", "Inventory"],
            ["priceSqft", "Price / SF"],
          ] as [ChartView, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setChartView(key)}
              className={`px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                chartView === key
                  ? "bg-navy text-white"
                  : "bg-warm-gray text-navy/50 hover:text-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["6", "12", "24"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors ${
                timeRange === r
                  ? "bg-gold text-white"
                  : "bg-warm-gray text-navy/50 hover:text-navy"
              }`}
            >
              {r}mo
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-navy/10 p-4 md:p-6">
        <h3 className="text-sm font-semibold text-navy mb-4">
          {chartView === "price" && `${neighborhoodName} — Median & Average Price`}
          {chartView === "inventory" && `${neighborhoodName} — Listing Activity`}
          {chartView === "priceSqft" && `${neighborhoodName} — Average Price per Square Foot`}
        </h3>

        <div className="h-[300px] md:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === "price" ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNavy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={NAVY} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={NAVY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: MID_GRAY }} />
                <YAxis tickFormatter={(v) => formatPrice(v)} tick={{ fontSize: 11, fill: MID_GRAY }} width={65} />
                <Tooltip formatter={formatTooltipValue} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="medianPrice"
                  name="Median Price"
                  stroke={GOLD}
                  strokeWidth={2}
                  fill="url(#gradGold)"
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="avgPrice"
                  name="Avg Price"
                  stroke={NAVY}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  fill="url(#gradNavy)"
                  connectNulls
                />
              </AreaChart>
            ) : chartView === "inventory" ? (
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: MID_GRAY }} />
                <YAxis tick={{ fontSize: 11, fill: MID_GRAY }} width={40} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="newListings" name="New Listings" fill={GOLD} radius={[2, 2, 0, 0]} />
                <Bar dataKey="activeListings" name="Active Listings" fill={NAVY} radius={[2, 2, 0, 0]} opacity={0.7} />
                <Bar dataKey="priceChanges" name="Price Changes" fill={MID_GRAY} radius={[2, 2, 0, 0]} opacity={0.5} />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradPsf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: MID_GRAY }} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: MID_GRAY }} width={50} />
                <Tooltip formatter={(value: unknown) => typeof value === "number" ? `$${value}/SF` : "—"} />
                <Area
                  type="monotone"
                  dataKey="avgPricePerSqft"
                  name="Avg $/SF"
                  stroke={GOLD}
                  strokeWidth={2}
                  fill="url(#gradPsf)"
                  connectNulls
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data note */}
      <p className="text-[11px] text-mid-gray mt-3 text-right">
        Data from SuperSearch &middot; ZIP{zips.length > 1 ? "s" : ""}: {zips.join(", ")} &middot; {searchMode}
      </p>
    </div>
  );
}

function SummaryCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="bg-white border border-navy/10 p-5">
      <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-mid-gray mb-1">{label}</p>
      <p className="text-2xl font-bold text-navy">{value}</p>
      {subtitle && <p className="text-[11px] text-mid-gray mt-0.5">{subtitle}</p>}
    </div>
  );
}
