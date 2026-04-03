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
} from "recharts";

interface AnalyticsData {
  funnel: { stage: string; count: number }[];
  activityTrends: { date: string; label: string; views: number; saves: number; showings: number }[];
  summary: {
    totalUsers: number;
    totalClients: number;
    totalLeads: number;
    activeLeads: number;
    closedDeals: number;
    underContract: number;
    conversionRate: number;
    pipelineValue: number;
    pipelineCount: number;
    totalVolume: number;
    totalGCI: number;
    showingsRequested: number;
    showingsCompleted: number;
    showingConversion: number;
  };
  revenue: { month: string; label: string; volume: number; gci: number; deals: number }[];
}

const STAGE_LABELS: Record<string, string> = {
  new: "New Leads",
  searching: "Searching",
  touring: "Touring",
  offer: "Making Offer",
  under_contract: "Under Contract",
  closed: "Closed",
};

const NAVY = "#0a1628";
const GOLD = "#c9a96e";

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/analytics")
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-mid-gray text-sm">Loading analytics...</p>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center text-mid-gray">Failed to load analytics.</div>;

  const s = data.summary;

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Agent Tools</p>
        <h1 className="text-2xl md:text-3xl font-light text-navy">
          Business <span className="font-semibold">Analytics</span>
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        <KPI label="Registered Users" value={s.totalUsers} />
        <KPI label="Active Leads" value={s.activeLeads} />
        <KPI label="Under Contract" value={s.underContract} highlight />
        <KPI label="Closed Deals" value={s.closedDeals} highlight />
        <KPI label="Conversion Rate" value={`${s.conversionRate}%`} />
        <KPI label="Total GCI" value={s.totalGCI > 0 ? fmt(s.totalGCI) : "—"} highlight />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Pipeline Funnel */}
        <div className="bg-white border border-navy/10 p-6">
          <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Pipeline Funnel</h3>
          <div className="space-y-3">
            {data.funnel.map((stage, i) => {
              const maxCount = Math.max(...data.funnel.map((f) => f.count), 1);
              const width = (stage.count / maxCount) * 100;
              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <div className="w-28 text-right">
                    <span className="text-[11px] text-mid-gray">{STAGE_LABELS[stage.stage] || stage.stage}</span>
                  </div>
                  <div className="flex-1 h-7 bg-navy/5 relative overflow-hidden">
                    <div
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${Math.max(width, 2)}%`,
                        backgroundColor: i < 3 ? NAVY : GOLD,
                        opacity: 0.6 + (i * 0.07),
                      }}
                    />
                    <span className="absolute inset-y-0 left-2 flex items-center text-xs font-semibold text-white mix-blend-difference">
                      {stage.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-navy/10 flex justify-between text-[11px] text-mid-gray">
            <span>Total pipeline: {s.totalLeads} leads</span>
            <span>Pipeline value: {s.pipelineValue > 0 ? fmt(s.pipelineValue) : "—"}</span>
          </div>
        </div>

        {/* Showing Metrics */}
        <div className="bg-white border border-navy/10 p-6">
          <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Showing Performance</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-warm-gray">
              <p className="text-2xl font-bold text-navy">{s.showingsRequested}</p>
              <p className="text-[9px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Requested</p>
            </div>
            <div className="text-center p-4 bg-warm-gray">
              <p className="text-2xl font-bold text-green-700">{s.showingsCompleted}</p>
              <p className="text-[9px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Completed</p>
            </div>
            <div className="text-center p-4 bg-warm-gray">
              <p className="text-2xl font-bold text-gold">{s.showingConversion}%</p>
              <p className="text-[9px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Completion Rate</p>
            </div>
          </div>
          <div className="flex justify-between text-[11px] text-mid-gray">
            <span>Total volume: {s.totalVolume > 0 ? fmt(s.totalVolume) : "—"}</span>
            <span>Avg deal: {s.closedDeals > 0 ? fmt(s.totalVolume / s.closedDeals) : "—"}</span>
          </div>
        </div>
      </div>

      {/* Activity Trends Chart */}
      <div className="bg-white border border-navy/10 p-6 mb-8">
        <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">30-Day Activity Trends</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.activityTrends} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="anaGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip />
              <Area type="monotone" dataKey="views" name="Views" stroke={NAVY} strokeWidth={1.5} fill="url(#anaGold)" />
              <Area type="monotone" dataKey="saves" name="Saves" stroke={GOLD} strokeWidth={2} fill="none" />
              <Area type="monotone" dataKey="showings" name="Showings" stroke="#22c55e" strokeWidth={1.5} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Chart */}
      {data.revenue.length > 0 && (
        <div className="bg-white border border-navy/10 p-6">
          <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Revenue by Month</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenue} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10 }} width={55} />
                <Tooltip formatter={(value: unknown) => typeof value === "number" ? fmt(value) : "—"} />
                <Bar dataKey="volume" name="Volume" fill={NAVY} opacity={0.5} radius={[2, 2, 0, 0]} />
                <Bar dataKey="gci" name="GCI" fill={GOLD} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-white border border-navy/10 p-4 text-center">
      <p className={`text-xl font-bold ${highlight ? "text-gold" : "text-navy"}`}>{value}</p>
      <p className="text-[9px] font-semibold tracking-[0.1em] uppercase text-mid-gray mt-1">{label}</p>
    </div>
  );
}
