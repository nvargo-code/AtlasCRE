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

export default function AgentDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<AgentDashboardData | null>(null);
  const userRole = (session?.user as { role?: string })?.role;

  useEffect(() => {
    async function load() {
      const [showRes, msgRes] = await Promise.all([
        fetch("/api/portal/showings"),
        fetch("/api/portal/messages"),
      ]);

      const showData = showRes.ok ? await showRes.json() : { showings: [] };
      const msgData = msgRes.ok ? await msgRes.json() : { threads: [] };

      setData({
        totalClients: 0, // Would need a dedicated API
        activeClients: 0,
        pendingShowings: showData.showings?.filter((s: { status: string }) => s.status === "requested").length || 0,
        unreadMessages: msgData.threads?.filter((t: { hasUnread: boolean }) => t.hasUnread).length || 0,
        recentShowings: showData.showings?.slice(0, 5) || [],
      });
    }
    load();
  }, []);

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
        <Link href="/portal/collections" className="bg-white p-5 border border-navy/10 hover:border-gold/30 transition-colors">
          <h3 className="font-semibold text-navy mb-1">Collections</h3>
          <p className="text-mid-gray text-sm">Create curated boards for your clients.</p>
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
