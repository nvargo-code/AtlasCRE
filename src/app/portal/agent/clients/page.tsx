"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ClientActivity {
  id: string;
  action: string;
  createdAt: string;
  listing: {
    id: string;
    address: string;
    city: string;
    priceAmount: number | null;
    imageUrl: string | null;
  } | null;
}

interface LeadScore {
  clientId: string;
  clientName: string | null;
  clientEmail: string;
  clientPhone: string | null;
  score: number;
  tier: "hot" | "warm" | "cold";
  signals: {
    lastActive: string | null;
    viewsLast7d: number;
    savesLast7d: number;
    totalSaved: number;
    showingsRequested: number;
    showingsCompleted: number;
    daysAsClient: number;
  };
  reasoning: string;
  suggestedAction: string;
}

interface LeadData {
  leads: LeadScore[];
  summary: { total: number; hot: number; warm: number; cold: number };
}

const ACTION_LABELS: Record<string, string> = {
  view: "Viewed",
  save: "Saved",
  unsave: "Unsaved",
  share: "Shared",
  compare: "Compared",
  request_showing: "Requested showing",
  click_photo: "Viewed photos",
};

const ACTION_COLORS: Record<string, string> = {
  view: "text-navy/50",
  save: "text-gold",
  request_showing: "text-green-600",
  share: "text-blue-600",
  compare: "text-purple-600",
};

const TIER_STYLES = {
  hot: { bg: "bg-red-50 border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  warm: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  cold: { bg: "bg-blue-50 border-blue-200", text: "text-blue-600", badge: "bg-blue-100 text-blue-600", dot: "bg-blue-400" },
};

interface UnassignedUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  _count: { listingActivities: number; favorites: number };
}

type ViewMode = "leads" | "activity" | "unassigned";

export default function AgentClientsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("leads");
  const [unassigned, setUnassigned] = useState<UnassignedUser[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [actRes, leadRes, unRes] = await Promise.all([
      fetch("/api/portal/activity?all=true"),
      fetch("/api/portal/lead-score"),
      fetch("/api/portal/assign-client"),
    ]);

    if (actRes.ok) {
      const data = await actRes.json();
      setActivities(data.activity || []);
    }
    if (leadRes.ok) {
      setLeadData(await leadRes.json());
    }
    if (unRes.ok) {
      const data = await unRes.json();
      setUnassigned(data.unassigned || []);
    }
    setLoading(false);
  }

  async function assignClient(clientId: string) {
    setAssigning(clientId);
    const res = await fetch("/api/portal/assign-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    if (res.ok) {
      setUnassigned((prev) => prev.filter((u) => u.id !== clientId));
    }
    setAssigning(null);
  }

  if (userRole !== "AGENT" && userRole !== "ADMIN") {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-semibold text-navy mb-2">Agent Access Required</h1>
        <p className="text-mid-gray">This page is for Shapiro Group agents only.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/portal/agent" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark mb-2 inline-block">
            &larr; Agent Dashboard
          </Link>
          <h1 className="text-2xl font-light text-navy">
            Client <span className="font-semibold">Intelligence</span>
          </h1>
          <p className="text-mid-gray text-sm mt-1">
            Lead scores, activity tracking, and suggested actions.
          </p>
        </div>
        <button
          onClick={loadData}
          className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark"
        >
          Refresh
        </button>
      </div>

      {/* Lead Score Summary */}
      {leadData && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 text-center">
            <p className="text-2xl font-bold text-navy">{leadData.summary.total}</p>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Total Leads</p>
          </div>
          <div className="bg-red-50 p-5 text-center border border-red-200">
            <p className="text-2xl font-bold text-red-700">{leadData.summary.hot}</p>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-red-600 mt-1">Hot</p>
          </div>
          <div className="bg-amber-50 p-5 text-center border border-amber-200">
            <p className="text-2xl font-bold text-amber-700">{leadData.summary.warm}</p>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-amber-600 mt-1">Warm</p>
          </div>
          <div className="bg-blue-50 p-5 text-center border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">{leadData.summary.cold}</p>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-blue-500 mt-1">Cold</p>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-1 mb-6">
        {(["leads", "unassigned", "activity"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors ${
              viewMode === mode ? "bg-navy text-white" : "bg-white text-navy/50 hover:text-navy border border-navy/10"
            }`}
          >
            {mode === "leads" ? "Lead Scores" : mode === "unassigned" ? `Unassigned (${unassigned.length})` : "Activity Feed"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-mid-gray text-center py-16">Loading...</div>
      ) : viewMode === "leads" ? (
        /* Lead Scores View */
        leadData && leadData.leads.length > 0 ? (
          <div className="space-y-3">
            {leadData.leads.map((lead) => {
              const style = TIER_STYLES[lead.tier];
              return (
                <div key={lead.clientId} className={`border p-5 ${style.bg}`}>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Client info + score */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sm font-bold text-navy">
                          {(lead.clientName?.[0] || lead.clientEmail[0]).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${style.dot} border-2 border-white`} />
                      </div>
                      <div>
                        <p className="font-semibold text-navy text-sm">{lead.clientName || lead.clientEmail.split("@")[0]}</p>
                        <p className="text-[11px] text-mid-gray">{lead.clientEmail}</p>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-20">
                        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${style.dot}`}
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${style.text}`}>{lead.score}</span>
                      <span className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded ${style.badge}`}>
                        {lead.tier}
                      </span>
                    </div>

                    {/* Signals */}
                    <div className="flex flex-wrap gap-2 flex-1">
                      <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded text-navy/60">
                        {lead.signals.viewsLast7d} views/wk
                      </span>
                      <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded text-navy/60">
                        {lead.signals.savesLast7d} saves/wk
                      </span>
                      <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded text-navy/60">
                        {lead.signals.totalSaved} total saved
                      </span>
                      {lead.signals.showingsRequested > 0 && (
                        <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded text-green-700">
                          {lead.signals.showingsRequested} tour requests
                        </span>
                      )}
                      {lead.signals.lastActive && (
                        <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded text-navy/40">
                          Last: {new Date(lead.signals.lastActive).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reasoning + suggested action */}
                  <div className="mt-3 pt-3 border-t border-inherit flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <p className="text-[11px] text-navy/60">{lead.reasoning}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-navy/80">
                        <span className="text-gold">Suggested:</span> {lead.suggestedAction}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-navy/10">
            <h3 className="text-lg font-semibold text-navy mb-2">No leads to score</h3>
            <p className="text-mid-gray text-sm">
              Assign clients to your pipeline to see lead scores.
            </p>
          </div>
        )
      ) : viewMode === "unassigned" ? (
        /* Unassigned Users */
        unassigned.length > 0 ? (
          <div className="space-y-3">
            {unassigned.map((user) => (
              <div key={user.id} className="bg-white border border-navy/10 p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center text-sm font-bold text-navy flex-shrink-0">
                    {(user.name?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-navy text-sm">{user.name || user.email.split("@")[0]}</p>
                    <p className="text-[11px] text-mid-gray">{user.email}</p>
                    {user.phone && <p className="text-[11px] text-mid-gray">{user.phone}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[10px] bg-navy/5 text-navy/50 px-2 py-0.5">{user._count.listingActivities} views</span>
                  <span className="text-[10px] bg-navy/5 text-navy/50 px-2 py-0.5">{user._count.favorites} saved</span>
                  <span className="text-[10px] text-mid-gray">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => assignClient(user.id)}
                    disabled={assigning === user.id}
                    className="px-4 py-2 text-[10px] font-semibold tracking-wider uppercase bg-gold text-white hover:bg-gold-dark disabled:opacity-50 transition-colors"
                  >
                    {assigning === user.id ? "Assigning..." : "Assign to Me"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-navy/10 p-12 text-center">
            <h3 className="text-lg font-semibold text-navy mb-2">All Users Assigned</h3>
            <p className="text-mid-gray text-sm">Every registered user has been assigned to an agent.</p>
          </div>
        )
      ) : (
        /* Activity Feed View */
        activities.length === 0 ? (
          <div className="text-center py-16 bg-white border border-navy/10">
            <h3 className="text-lg font-semibold text-navy mb-2">No activity yet</h3>
            <p className="text-mid-gray text-sm">
              Activity will appear here as clients browse, save, and request showings.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-navy/10">
            <div className="divide-y divide-navy/5">
              {activities.slice(0, 50).map((act) => (
                <div key={act.id} className="p-4 flex items-center gap-4 hover:bg-warm-gray transition-colors">
                  {act.listing?.imageUrl && (
                    <Link href={`/listings/${act.listing.id}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={act.listing.imageUrl} alt="" className="w-12 h-12 object-cover flex-shrink-0" />
                    </Link>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`text-[11px] font-semibold tracking-[0.08em] uppercase ${ACTION_COLORS[act.action] || "text-navy/50"}`}>
                      {ACTION_LABELS[act.action] || act.action}
                    </span>
                    {act.listing && (
                      <Link href={`/listings/${act.listing.id}`} className="text-sm text-navy hover:text-gold transition-colors truncate block">
                        {act.listing.address}, {act.listing.city}
                        {act.listing.priceAmount && ` — $${act.listing.priceAmount.toLocaleString()}`}
                      </Link>
                    )}
                  </div>
                  <span className="text-[11px] text-mid-gray flex-shrink-0">
                    {new Date(act.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
