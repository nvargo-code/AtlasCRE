"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface AgentDashboardData {
  totalClients: number;
  activeClients: number;
  pendingShowings: number;
  unreadMessages: number;
  recentShowings: Array<{
    id: string;
    status: string;
    createdAt: string;
    listing: { address: string; city: string; priceAmount: number | null };
    client: { name: string | null; email: string };
  }>;
}

interface PipelineClient {
  id: string;
  stage: string;
  status: string;
  notes: string | null;
  priceMin: number | null;
  priceMax: number | null;
  targetAreas: string[];
  updatedAt: string;
  client: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    listingActivities: { id: string }[];
    favorites: { id: string }[];
    showingRequestsAsClient: { id: string; status: string }[];
  };
  agent: { id: string; name: string | null };
}

interface PipelineData {
  pipeline: Record<string, PipelineClient[]>;
  stats: { total: number; active: number; byStage: Record<string, number> };
  stages: string[];
}

interface FollowUpSuggestion {
  id: string;
  priority: "high" | "medium" | "low";
  clientName: string;
  type: string;
  title: string;
  body: string;
  suggestedMessage: string;
  action: string;
}

interface LeaderboardAgent {
  id: string;
  name: string;
  email: string;
  stats: {
    closedDeals: number;
    underContract: number;
    gci: number;
    totalVolume: number;
    pipelineValue: number;
    activeClients: number;
    showingsCompleted: number;
  };
}

interface TeamTotals {
  closedDeals: number;
  totalVolume: number;
  totalGCI: number;
  pipelineValue: number;
  underContract: number;
}

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New Leads", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  searching: { label: "Searching", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  touring: { label: "Touring", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  offer: { label: "Making Offer", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  under_contract: { label: "Under Contract", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  closed: { label: "Closed", color: "text-navy", bg: "bg-navy/5 border-navy/20" },
};

function formatPrice(n: number | null) {
  if (!n) return "";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(n / 1000)}K`;
}

export default function AgentDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<AgentDashboardData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [updatingClient, setUpdatingClient] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardAgent[]>([]);
  const [teamTotals, setTeamTotals] = useState<TeamTotals | null>(null);
  const [followUps, setFollowUps] = useState<FollowUpSuggestion[]>([]);
  const [copiedFU, setCopiedFU] = useState<string | null>(null);
  const [digest, setDigest] = useState<{ newUsers: number; newShowings: number; newMessages: number; newListings: number; pendingShowings: number; priceChanges: number } | null>(null);
  const userRole = (session?.user as { role?: string })?.role;

  useEffect(() => {
    async function load() {
      const [showRes, msgRes, pipeRes, lbRes, fuRes] = await Promise.all([
        fetch("/api/portal/showings"),
        fetch("/api/portal/messages"),
        fetch("/api/portal/pipeline"),
        fetch("/api/portal/leaderboard"),
        fetch("/api/portal/follow-ups"),
      ]);

      const showData = showRes.ok ? await showRes.json() : { showings: [] };
      const msgData = msgRes.ok ? await msgRes.json() : { threads: [] };
      const pipeData = pipeRes.ok ? await pipeRes.json() : null;

      setData({
        totalClients: pipeData?.stats?.total ?? 0,
        activeClients: pipeData?.stats?.active ?? 0,
        pendingShowings: showData.showings?.filter((s: { status: string }) => s.status === "requested").length || 0,
        unreadMessages: msgData.threads?.filter((t: { hasUnread: boolean }) => t.hasUnread).length || 0,
        recentShowings: showData.showings?.slice(0, 5) || [],
      });

      if (pipeData) setPipeline(pipeData);

      if (lbRes.ok) {
        const lbData = await lbRes.json();
        setLeaderboard(lbData.leaderboard || []);
        setTeamTotals(lbData.teamTotals || null);
      }

      if (fuRes.ok) {
        const fuData = await fuRes.json();
        setFollowUps(fuData.suggestions || []);
      }

      // Fetch daily digest
      fetch("/api/portal/daily-digest")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d?.digest) setDigest(d.digest); })
        .catch(() => {});
    }
    load();
  }, []);

  async function moveClient(clientId: string, newStage: string) {
    setUpdatingClient(clientId);
    try {
      const res = await fetch("/api/portal/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, stage: newStage }),
      });
      if (res.ok && pipeline) {
        // Optimistically update the UI
        const updated = { ...pipeline };
        let movedClient: PipelineClient | null = null;

        for (const stage of Object.keys(updated.pipeline)) {
          const idx = updated.pipeline[stage].findIndex((c) => c.client.id === clientId);
          if (idx !== -1) {
            movedClient = updated.pipeline[stage].splice(idx, 1)[0];
            break;
          }
        }

        if (movedClient) {
          movedClient.stage = newStage;
          if (!updated.pipeline[newStage]) updated.pipeline[newStage] = [];
          updated.pipeline[newStage].unshift(movedClient);
        }

        setPipeline({ ...updated });
      }
    } catch {
      // Silently fail
    }
    setUpdatingClient(null);
  }

  if (userRole !== "AGENT" && userRole !== "ADMIN") {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-semibold text-navy mb-2">Agent Access Required</h1>
        <p className="text-mid-gray">This dashboard is for Shapiro Group agents only.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-light text-navy">
          Agent <span className="font-semibold">Dashboard</span>
        </h1>
        <p className="text-mid-gray text-sm mt-1">Manage clients, showings, and messages.</p>
      </div>

      {/* Daily Digest Banner */}
      {digest && (digest.newUsers > 0 || digest.newShowings > 0 || digest.newMessages > 0 || digest.newListings > 0) && (
        <div className="bg-gold/5 border border-gold/20 p-4 mb-6 flex flex-wrap items-center gap-4">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-gold">Last 24h:</span>
          {digest.newUsers > 0 && <span className="text-sm text-navy"><strong>{digest.newUsers}</strong> new leads</span>}
          {digest.newShowings > 0 && <span className="text-sm text-navy"><strong>{digest.newShowings}</strong> showing requests</span>}
          {digest.newMessages > 0 && <span className="text-sm text-navy"><strong>{digest.newMessages}</strong> new messages</span>}
          {digest.newListings > 0 && <span className="text-sm text-navy"><strong>{digest.newListings}</strong> new listings</span>}
          {digest.priceChanges > 0 && <span className="text-sm text-navy"><strong>{digest.priceChanges}</strong> price changes</span>}
          {digest.pendingShowings > 0 && <span className="text-sm text-red-600"><strong>{digest.pendingShowings}</strong> pending confirmation</span>}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Active Clients", value: data?.activeClients ?? "—", color: "text-navy" },
          { label: "Pending Showings", value: data?.pendingShowings ?? "—", color: "text-gold", href: "/portal/showings" },
          { label: "Unread Messages", value: data?.unreadMessages ?? "—", color: "text-blue-600", href: "/portal/messages" },
          { label: "Total Clients", value: data?.totalClients ?? "—", color: "text-mid-gray" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6">
            {stat.href ? (
              <Link href={stat.href}>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-2">{stat.label}</p>
              </Link>
            ) : (
              <>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-2">{stat.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Smart Follow-Up Suggestions */}
      {followUps.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy">Suggested Actions</h2>
            <span className="text-[11px] font-semibold text-gold">{followUps.length} follow-ups</span>
          </div>
          <div className="space-y-3">
            {followUps.slice(0, 5).map((fu) => (
              <div key={fu.id} className={`bg-white border p-4 ${
                fu.priority === "high" ? "border-red-200 bg-red-50/30" :
                fu.priority === "medium" ? "border-gold/30" : "border-navy/10"
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 ${
                        fu.priority === "high" ? "bg-red-100 text-red-700" :
                        fu.priority === "medium" ? "bg-gold/10 text-gold" :
                        "bg-navy/5 text-navy/40"
                      }`}>{fu.priority}</span>
                      <span className="text-sm font-semibold text-navy">{fu.title}</span>
                    </div>
                    <p className="text-[12px] text-mid-gray">{fu.body}</p>
                    {/* Suggested message */}
                    <div className="mt-2 bg-warm-gray p-3 text-[12px] text-navy/70 italic">
                      &ldquo;{fu.suggestedMessage}&rdquo;
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(fu.suggestedMessage);
                      setCopiedFU(fu.id);
                      setTimeout(() => setCopiedFU(null), 2000);
                    }}
                    className="flex-shrink-0 text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 bg-gold text-white hover:bg-gold-dark transition-colors"
                  >
                    {copiedFU === fu.id ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Board */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy">Client Pipeline</h2>
          <Link href="/portal/agent/clients" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark">
            Activity Feed
          </Link>
        </div>

        {pipeline && Object.keys(pipeline.pipeline).some((s) => pipeline.pipeline[s].length > 0) ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {(pipeline.stages || Object.keys(STAGE_CONFIG)).map((stage) => {
              const config = STAGE_CONFIG[stage] || { label: stage, color: "text-navy", bg: "bg-white border-navy/10" };
              const clients = pipeline.pipeline[stage] || [];

              return (
                <div key={stage} className={`border rounded-lg overflow-hidden ${config.bg}`}>
                  {/* Stage Header */}
                  <div className="p-3 border-b border-inherit">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-[11px] font-semibold tracking-[0.1em] uppercase ${config.color}`}>
                        {config.label}
                      </h3>
                      <span className={`text-[10px] font-bold ${config.color} opacity-60`}>
                        {clients.length}
                      </span>
                    </div>
                  </div>

                  {/* Client Cards */}
                  <div className="p-2 space-y-2 min-h-[100px]">
                    {clients.map((rel) => (
                      <div
                        key={rel.id}
                        className={`bg-white rounded p-3 shadow-sm border border-transparent hover:border-gold/30 transition-all ${
                          updatingClient === rel.client.id ? "opacity-50" : ""
                        }`}
                      >
                        {/* Client info */}
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center text-[10px] font-bold text-navy flex-shrink-0">
                            {(rel.client.name?.[0] || rel.client.email[0]).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-navy truncate">
                              {rel.client.name || rel.client.email.split("@")[0]}
                            </p>
                            {rel.client.phone && (
                              <p className="text-[10px] text-mid-gray truncate">{rel.client.phone}</p>
                            )}
                          </div>
                        </div>

                        {/* Activity indicators */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {rel.client.listingActivities.length > 0 && (
                            <span className="text-[9px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                              {rel.client.listingActivities.length} views/wk
                            </span>
                          )}
                          {rel.client.favorites.length > 0 && (
                            <span className="text-[9px] font-semibold bg-red-50 text-red-500 px-1.5 py-0.5 rounded">
                              {rel.client.favorites.length} saved
                            </span>
                          )}
                          {rel.client.showingRequestsAsClient.length > 0 && (
                            <span className="text-[9px] font-semibold bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                              {rel.client.showingRequestsAsClient.length} tours
                            </span>
                          )}
                        </div>

                        {/* Price range */}
                        {(rel.priceMin || rel.priceMax) && (
                          <p className="text-[10px] text-mid-gray mb-2">
                            {formatPrice(rel.priceMin)}{rel.priceMin && rel.priceMax ? " – " : ""}{formatPrice(rel.priceMax)}
                          </p>
                        )}

                        {/* Target areas */}
                        {rel.targetAreas.length > 0 && (
                          <p className="text-[10px] text-mid-gray mb-2 truncate">
                            {rel.targetAreas.join(", ")}
                          </p>
                        )}

                        {/* Stage move buttons */}
                        <div className="flex gap-1 mt-1">
                          {stage !== "new" && (
                            <button
                              onClick={() => {
                                const stages = pipeline.stages || Object.keys(STAGE_CONFIG);
                                const idx = stages.indexOf(stage);
                                if (idx > 0) moveClient(rel.client.id, stages[idx - 1]);
                              }}
                              className="text-[9px] text-navy/30 hover:text-navy transition-colors"
                              title="Move to previous stage"
                            >
                              &larr;
                            </button>
                          )}
                          {stage !== "closed" && (
                            <button
                              onClick={() => {
                                const stages = pipeline.stages || Object.keys(STAGE_CONFIG);
                                const idx = stages.indexOf(stage);
                                if (idx < stages.length - 1) moveClient(rel.client.id, stages[idx + 1]);
                              }}
                              className="text-[9px] text-navy/30 hover:text-gold transition-colors ml-auto"
                              title="Move to next stage"
                            >
                              &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {clients.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-[10px] text-mid-gray/50">No clients</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-navy/10 p-8 text-center">
            <p className="text-mid-gray text-sm mb-2">No clients in the pipeline yet.</p>
            <p className="text-[11px] text-mid-gray">
              When leads register on the site and get assigned to you, they&apos;ll appear here.
            </p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <Link href="/portal/showings" className="bg-white p-5 border border-navy/10 hover:border-gold/30 transition-colors">
          <h3 className="font-semibold text-navy mb-1">Showing Requests</h3>
          <p className="text-mid-gray text-sm">Review and confirm tour requests from clients.</p>
        </Link>
        <Link href="/portal/messages" className="bg-white p-5 border border-navy/10 hover:border-gold/30 transition-colors">
          <h3 className="font-semibold text-navy mb-1">Client Messages</h3>
          <p className="text-mid-gray text-sm">Respond to client questions about properties.</p>
        </Link>
        <Link href="/portal/agent/cma" className="bg-white p-5 border border-navy/10 hover:border-gold/30 transition-colors">
          <h3 className="font-semibold text-navy mb-1">CMA Tool</h3>
          <p className="text-mid-gray text-sm">Run a Comparative Market Analysis with SuperSearch data.</p>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-10">
        <Link href="/portal/agent/presentation" className="bg-white p-5 border border-navy/10 hover:border-gold/30 transition-colors">
          <h3 className="font-semibold text-navy mb-1">Listing Presentation</h3>
          <p className="text-mid-gray text-sm">Generate a professional listing presentation with comps and branding.</p>
        </Link>
        <Link href="/portal/agent/tours" className="bg-white p-5 border border-navy/10 hover:border-gold/30 transition-colors">
          <h3 className="font-semibold text-navy mb-1">Tour Planner</h3>
          <p className="text-mid-gray text-sm">Plan and manage showing tours for your clients.</p>
        </Link>
      </div>

      {/* Recent showing requests */}
      {data?.recentShowings && data.recentShowings.length > 0 && (
        <div className="bg-white border border-navy/10">
          <div className="p-4 border-b border-navy/10 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Recent Showing Requests</h2>
            <Link href="/portal/showings" className="text-[11px] font-semibold text-gold hover:text-gold-dark">
              View All
            </Link>
          </div>
          <div>
            {data.recentShowings.map((showing) => (
              <div key={showing.id} className="p-4 border-b border-navy/5 last:border-0 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-navy">{showing.listing.address}</p>
                  <p className="text-[11px] text-mid-gray">
                    {showing.client.name || showing.client.email} &middot; {new Date(showing.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  showing.status === "requested" ? "bg-blue-100 text-blue-700" :
                  showing.status === "confirmed" ? "bg-green-100 text-green-700" :
                  "bg-navy/10 text-navy/50"
                }`}>
                  {showing.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-navy mb-4">Team Performance</h2>

          {/* Team totals */}
          {teamTotals && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="bg-navy text-white p-4 text-center">
                <p className="text-xl font-bold">{teamTotals.closedDeals}</p>
                <p className="text-[9px] font-semibold tracking-wider uppercase text-white/50 mt-1">Closed Deals</p>
              </div>
              <div className="bg-navy text-white p-4 text-center">
                <p className="text-xl font-bold">{teamTotals.underContract}</p>
                <p className="text-[9px] font-semibold tracking-wider uppercase text-white/50 mt-1">Under Contract</p>
              </div>
              <div className="bg-navy text-white p-4 text-center">
                <p className="text-xl font-bold text-gold">{teamTotals.totalGCI > 0 ? `$${Math.round(teamTotals.totalGCI / 1000)}K` : "—"}</p>
                <p className="text-[9px] font-semibold tracking-wider uppercase text-white/50 mt-1">Team GCI</p>
              </div>
              <div className="bg-navy text-white p-4 text-center">
                <p className="text-xl font-bold">{teamTotals.totalVolume > 0 ? `$${(teamTotals.totalVolume / 1_000_000).toFixed(1)}M` : "—"}</p>
                <p className="text-[9px] font-semibold tracking-wider uppercase text-white/50 mt-1">Total Volume</p>
              </div>
              <div className="bg-navy text-white p-4 text-center">
                <p className="text-xl font-bold">{teamTotals.pipelineValue > 0 ? `$${(teamTotals.pipelineValue / 1_000_000).toFixed(1)}M` : "—"}</p>
                <p className="text-[9px] font-semibold tracking-wider uppercase text-white/50 mt-1">Pipeline</p>
              </div>
            </div>
          )}

          {/* Agent rows */}
          <div className="bg-white border border-navy/10">
            <div className="grid grid-cols-7 p-3 border-b border-navy/10 text-[10px] font-semibold tracking-wider uppercase text-mid-gray">
              <div className="col-span-2">Agent</div>
              <div className="text-center">Closed</div>
              <div className="text-center">Active</div>
              <div className="text-center">Showings</div>
              <div className="text-center">Volume</div>
              <div className="text-center">GCI</div>
            </div>
            {leaderboard.map((agent, i) => (
              <div key={agent.id} className={`grid grid-cols-7 p-3 items-center ${i < leaderboard.length - 1 ? "border-b border-navy/5" : ""}`}>
                <div className="col-span-2 flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i === 0 ? "bg-gold text-white" : "bg-navy/10 text-navy"
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium text-navy truncate">{agent.name}</span>
                </div>
                <div className="text-center text-sm font-semibold text-navy">{agent.stats.closedDeals}</div>
                <div className="text-center text-sm text-mid-gray">{agent.stats.activeClients}</div>
                <div className="text-center text-sm text-mid-gray">{agent.stats.showingsCompleted}</div>
                <div className="text-center text-sm text-mid-gray">
                  {agent.stats.totalVolume > 0 ? `$${(agent.stats.totalVolume / 1_000_000).toFixed(1)}M` : "—"}
                </div>
                <div className="text-center text-sm font-semibold text-gold">
                  {agent.stats.gci > 0 ? `$${Math.round(agent.stats.gci / 1000)}K` : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tools */}
      <div className="mt-10 grid md:grid-cols-2 gap-4">
        <Link href="/admin-email" className="bg-navy text-white p-5 hover:bg-navy-light transition-colors">
          <h3 className="font-semibold mb-1">Add Pocket Listing</h3>
          <p className="text-white/50 text-sm">Paste an email or manually add an off-market property to SuperSearch.</p>
        </Link>
        <Link href="/admin/email-scan" className="bg-navy text-white p-5 hover:bg-navy-light transition-colors">
          <h3 className="font-semibold mb-1">Email Scanner</h3>
          <p className="text-white/50 text-sm">Monitor automated pocket listing detection from Gmail.</p>
        </Link>
      </div>
    </div>
  );
}
