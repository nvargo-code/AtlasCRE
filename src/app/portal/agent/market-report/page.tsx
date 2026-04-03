"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
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
}

interface ReportData {
  summary: MarketSummary;
  trends: TrendBucket[];
}

const NAVY = "#0a1628";
const GOLD = "#c9a96e";
const MID_GRAY = "#8a8f98";

function formatPrice(n: number | null) {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

export default function MarketReportPage() {
  const { data: session } = useSession();
  const agentName = session?.user?.name || "Shapiro Group Agent";

  const [zip, setZip] = useState("");
  const [areaName, setAreaName] = useState("");
  const [months, setMonths] = useState("12");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  async function generateReport() {
    if (!zip) return;
    setLoading(true);
    setData(null);
    setAiSummary("");
    setGenerated(false);

    try {
      const params = new URLSearchParams({ zips: zip, months, searchMode: "residential" });
      const res = await fetch(`/api/market-trends?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setGenerated(true);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }

  async function generateAISummary() {
    if (!data) return;
    setAiLoading(true);

    const dataPoints = [
      `Active listings: ${data.summary.totalListings}`,
      `Median price: ${formatPrice(data.summary.medianPrice)}`,
      `Avg price: ${formatPrice(data.summary.avgPrice)}`,
      `New listings in period: ${data.summary.totalNewListings}`,
      `Price changes: ${data.summary.totalPriceChanges}`,
    ].join(", ");

    try {
      const res = await fetch("/api/portal/ai-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "market_update",
          details: {
            area: areaName || `ZIP ${zip}`,
            dataPoints,
            timeframe: `Past ${months} months`,
            audience: "Buyers and sellers",
            takeaway: "",
          },
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setAiSummary(result.content);
      }
    } catch {
      // silently fail
    }
    setAiLoading(false);
  }

  const chartData = data?.trends.filter(
    (t) => t.medianPrice || t.newListings > 0 || t.activeListings > 0
  ) || [];

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Agent Tools</p>
          <h1 className="text-2xl md:text-3xl font-light text-navy">
            Market <span className="font-semibold">Report</span>
          </h1>
          <p className="text-mid-gray text-sm mt-2">
            Generate neighborhood market reports to share with clients.
          </p>
        </div>
        {generated && (
          <button
            onClick={() => window.print()}
            className="bg-navy text-white px-6 py-3 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90 transition-colors print:hidden"
          >
            Print / PDF
          </button>
        )}
      </div>

      {/* Config */}
      <div className="bg-white border border-navy/10 p-6 mb-8 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">ZIP Code(s)</label>
            <input
              type="text" value={zip} onChange={(e) => setZip(e.target.value)}
              placeholder="78704 or 78704,78745"
              className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Area Name</label>
            <input
              type="text" value={areaName} onChange={(e) => setAreaName(e.target.value)}
              placeholder="South Austin"
              className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Time Period</label>
            <select value={months} onChange={(e) => setMonths(e.target.value)} className="w-full border border-navy/15 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gold">
              <option value="6">6 months</option>
              <option value="12">12 months</option>
              <option value="24">24 months</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading || !zip}
              className="w-full bg-navy text-white py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Generate"}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Report */}
      {generated && data && (
        <div className="bg-white">
          {/* Report Header */}
          <div className="bg-navy p-10 md:p-14 text-center print:break-after-page">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logos/sg-horizontal-white.png" alt="Shapiro Group" className="h-8 mx-auto mb-8" />
            <p className="text-gold text-[12px] font-semibold tracking-[0.3em] uppercase mb-4">
              Market Report
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-white mb-2">
              {areaName || `ZIP ${zip}`}
            </h2>
            <p className="text-white/40 text-sm">
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} &middot; Past {months} months
            </p>
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white/30 text-sm">Prepared by</p>
              <p className="text-gold font-semibold">{agentName}</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="p-8 md:p-12 border-b border-navy/10">
            <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold mb-6">Market Snapshot</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-warm-gray">
                <p className="text-2xl font-bold text-navy">{data.summary.totalListings}</p>
                <p className="text-[10px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Active Listings</p>
              </div>
              <div className="text-center p-4 bg-warm-gray">
                <p className="text-2xl font-bold text-gold">{formatPrice(data.summary.medianPrice)}</p>
                <p className="text-[10px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Median Price</p>
              </div>
              <div className="text-center p-4 bg-warm-gray">
                <p className="text-2xl font-bold text-navy">{formatPrice(data.summary.avgPrice)}</p>
                <p className="text-[10px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Avg Price</p>
              </div>
              <div className="text-center p-4 bg-warm-gray">
                <p className="text-2xl font-bold text-navy">{data.summary.totalNewListings}</p>
                <p className="text-[10px] font-semibold tracking-wider uppercase text-mid-gray mt-1">New Listings</p>
              </div>
              <div className="text-center p-4 bg-warm-gray">
                <p className="text-2xl font-bold text-navy">{data.summary.totalPriceChanges}</p>
                <p className="text-[10px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Price Changes</p>
              </div>
            </div>
          </div>

          {/* Price Trend Chart */}
          {chartData.length > 0 && (
            <div className="p-8 md:p-12 border-b border-navy/10 print:break-after-page">
              <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold mb-2">Price Trends</h3>
              <p className="text-sm text-mid-gray mb-6">Median and average listing prices over time</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="rptGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: MID_GRAY }} />
                    <YAxis tickFormatter={(v) => formatPrice(v)} tick={{ fontSize: 10, fill: MID_GRAY }} width={60} />
                    <Tooltip formatter={(value: unknown) => typeof value === "number" ? `$${value.toLocaleString()}` : "—"} />
                    <Area type="monotone" dataKey="medianPrice" name="Median" stroke={GOLD} strokeWidth={2} fill="url(#rptGold)" connectNulls />
                    <Area type="monotone" dataKey="avgPrice" name="Average" stroke={NAVY} strokeWidth={1.5} strokeDasharray="5 5" fill="none" connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Inventory Chart */}
          {chartData.length > 0 && (
            <div className="p-8 md:p-12 border-b border-navy/10">
              <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold mb-2">Listing Activity</h3>
              <p className="text-sm text-mid-gray mb-6">New listings and active inventory per month</p>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: MID_GRAY }} />
                    <YAxis tick={{ fontSize: 10, fill: MID_GRAY }} width={35} />
                    <Tooltip />
                    <Bar dataKey="newListings" name="New Listings" fill={GOLD} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="activeListings" name="Active" fill={NAVY} radius={[2, 2, 0, 0]} opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* AI Summary */}
          <div className="p-8 md:p-12 border-b border-navy/10 print:break-after-page">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold">Market Analysis</h3>
              {!aiSummary && (
                <button
                  onClick={generateAISummary}
                  disabled={aiLoading}
                  className="text-[11px] font-semibold tracking-[0.1em] uppercase text-navy hover:text-gold transition-colors print:hidden"
                >
                  {aiLoading ? "Generating..." : "Generate AI Summary"}
                </button>
              )}
            </div>
            {aiSummary ? (
              <div className="text-sm text-navy leading-relaxed whitespace-pre-wrap">{aiSummary}</div>
            ) : aiLoading ? (
              <div className="flex items-center gap-2 text-mid-gray text-sm">
                <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                Atlas AI is analyzing market data...
              </div>
            ) : (
              <p className="text-mid-gray text-sm">
                Click &quot;Generate AI Summary&quot; to create a professional market analysis narrative.
              </p>
            )}
          </div>

          {/* Monthly Data Table */}
          <div className="p-8 md:p-12 border-b border-navy/10">
            <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold mb-4">Monthly Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-navy">
                    <th className="text-left py-2 text-[10px] font-semibold tracking-wider uppercase text-navy">Month</th>
                    <th className="text-right py-2 text-[10px] font-semibold tracking-wider uppercase text-navy">Median</th>
                    <th className="text-right py-2 text-[10px] font-semibold tracking-wider uppercase text-navy">Average</th>
                    <th className="text-right py-2 text-[10px] font-semibold tracking-wider uppercase text-navy">$/SF</th>
                    <th className="text-right py-2 text-[10px] font-semibold tracking-wider uppercase text-navy">New</th>
                    <th className="text-right py-2 text-[10px] font-semibold tracking-wider uppercase text-navy">Active</th>
                    <th className="text-right py-2 text-[10px] font-semibold tracking-wider uppercase text-navy">Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trends.map((t) => (
                    <tr key={t.month} className="border-b border-navy/10">
                      <td className="py-2 text-navy font-medium">{t.label}</td>
                      <td className="py-2 text-right text-navy">{formatPrice(t.medianPrice)}</td>
                      <td className="py-2 text-right text-mid-gray">{formatPrice(t.avgPrice)}</td>
                      <td className="py-2 text-right text-mid-gray">{t.avgPricePerSqft ? `$${t.avgPricePerSqft}` : "—"}</td>
                      <td className="py-2 text-right text-mid-gray">{t.newListings}</td>
                      <td className="py-2 text-right text-mid-gray">{t.activeListings}</td>
                      <td className="py-2 text-right text-mid-gray">{t.priceChanges}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-navy p-8 text-center">
            <p className="text-white/30 text-[11px] tracking-wider uppercase mb-2">Prepared by</p>
            <p className="text-gold text-lg font-semibold">{agentName}</p>
            <p className="text-white/40 text-sm">Shapiro Group &middot; shapirogroup.co</p>
            <p className="text-white/20 text-[10px] mt-4">
              Data powered by SuperSearch &middot; {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
