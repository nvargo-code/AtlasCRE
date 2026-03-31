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

interface ClientSummary {
  id: string;
  name: string | null;
  email: string;
  recentActions: ClientActivity[];
  totalViews: number;
  totalSaves: number;
  totalShowings: number;
  lastActive: string | null;
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

export default function AgentClientsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  async function loadActivity() {
    setLoading(true);
    try {
      // Get all recent activity across all users
      const res = await fetch("/api/portal/activity?all=true");
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activity || []);
      }
    } catch {}
    setLoading(false);
  }

  if (userRole !== "AGENT" && userRole !== "ADMIN") {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-semibold text-navy mb-2">Agent Access Required</h1>
        <p className="text-mid-gray">This page is for Shapiro Group agents only.</p>
      </div>
    );
  }

  // Group activities by user
  const byUser: Record<string, ClientSummary> = {};
  for (const act of activities) {
    // Skip if no user association - would need userId in the response
    const key = "all-users";
    if (!byUser[key]) {
      byUser[key] = {
        id: key,
        name: "All Users",
        email: "",
        recentActions: [],
        totalViews: 0,
        totalSaves: 0,
        totalShowings: 0,
        lastActive: null,
      };
    }
    byUser[key].recentActions.push(act);
    if (act.action === "view") byUser[key].totalViews++;
    if (act.action === "save") byUser[key].totalSaves++;
    if (act.action === "request_showing") byUser[key].totalShowings++;
    if (!byUser[key].lastActive || act.createdAt > byUser[key].lastActive!) {
      byUser[key].lastActive = act.createdAt;
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/portal/agent" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark mb-2 inline-block">
            &larr; Agent Dashboard
          </Link>
          <h1 className="text-2xl font-light text-navy">
            Client <span className="font-semibold">Activity</span>
          </h1>
          <p className="text-mid-gray text-sm mt-1">
            See what buyers are viewing, saving, and requesting showings on.
          </p>
        </div>
        <button
          onClick={loadActivity}
          className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark"
        >
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 text-center">
          <p className="text-2xl font-bold text-navy">{activities.filter((a) => a.action === "view").length}</p>
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Views</p>
        </div>
        <div className="bg-white p-5 text-center">
          <p className="text-2xl font-bold text-gold">{activities.filter((a) => a.action === "save").length}</p>
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Saves</p>
        </div>
        <div className="bg-white p-5 text-center">
          <p className="text-2xl font-bold text-green-600">{activities.filter((a) => a.action === "request_showing").length}</p>
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-1">Tour Requests</p>
        </div>
      </div>

      {/* Activity feed */}
      {loading ? (
        <div className="text-mid-gray text-center py-16">Loading activity...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 bg-white border border-navy/10">
          <svg className="w-12 h-12 text-navy/10 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h3 className="text-lg font-semibold text-navy mb-2">No activity yet</h3>
          <p className="text-mid-gray text-sm">
            Activity will appear here as clients browse, save, and request showings.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-navy/10">
          <div className="p-4 border-b border-navy/10">
            <h2 className="font-semibold text-navy text-sm">Recent Activity</h2>
          </div>
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
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold tracking-[0.08em] uppercase ${ACTION_COLORS[act.action] || "text-navy/50"}`}>
                      {ACTION_LABELS[act.action] || act.action}
                    </span>
                  </div>
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
      )}
    </div>
  );
}
