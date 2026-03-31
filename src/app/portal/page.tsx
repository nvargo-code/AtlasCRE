"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
  savedCount: number;
  collectionsCount: number;
  pendingShowings: number;
  unreadMessages: number;
  recentActivity: Array<{
    id: string;
    action: string;
    createdAt: string;
    listing: { id: string; address: string; city: string; priceAmount: number | null; imageUrl: string | null } | null;
  }>;
}

export default function PortalDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [favRes, colRes, showRes, msgRes] = await Promise.all([
          fetch("/api/favorites"),
          fetch("/api/portal/collections"),
          fetch("/api/portal/showings"),
          fetch("/api/portal/messages"),
        ]);

        const favData = favRes.ok ? await favRes.json() : { length: 0 };
        const colData = colRes.ok ? await colRes.json() : { collections: [] };
        const showData = showRes.ok ? await showRes.json() : { showings: [] };
        const msgData = msgRes.ok ? await msgRes.json() : { threads: [] };

        setData({
          savedCount: Array.isArray(favData) ? favData.length : 0,
          collectionsCount: colData.collections?.length || 0,
          pendingShowings: showData.showings?.filter((s: { status: string }) => s.status === "requested" || s.status === "confirmed").length || 0,
          unreadMessages: msgData.threads?.filter((t: { hasUnread: boolean }) => t.hasUnread).length || 0,
          recentActivity: [],
        });
      } catch {
        setData({ savedCount: 0, collectionsCount: 0, pendingShowings: 0, unreadMessages: 0, recentActivity: [] });
      }
    }
    load();
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-light text-navy">
          {greeting}, <span className="font-semibold">{session?.user?.name?.split(" ")[0] || "there"}</span>
        </h1>
        <p className="text-mid-gray text-sm mt-1">
          Here&apos;s what&apos;s happening with your home search.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Saved Homes", value: data?.savedCount ?? "—", href: "/portal/saved", color: "text-gold" },
          { label: "Collections", value: data?.collectionsCount ?? "—", href: "/portal/collections", color: "text-navy" },
          { label: "Pending Showings", value: data?.pendingShowings ?? "—", href: "/portal/showings", color: "text-green-600" },
          { label: "Unread Messages", value: data?.unreadMessages ?? "—", href: "/portal/messages", color: "text-blue-600" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white p-6 hover:shadow-md transition-shadow"
          >
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mt-2">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <Link
          href="/search?searchMode=residential"
          className="bg-navy text-white p-6 flex items-center gap-4 hover:bg-navy-light transition-colors"
        >
          <svg className="w-8 h-8 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div>
            <p className="font-semibold">Search Properties</p>
            <p className="text-white/50 text-sm">Find homes with SuperSearch</p>
          </div>
        </Link>

        <Link
          href="/portal/collections"
          className="bg-white p-6 flex items-center gap-4 border border-navy/10 hover:border-gold/30 transition-colors"
        >
          <svg className="w-8 h-8 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <div>
            <p className="font-semibold text-navy">My Collections</p>
            <p className="text-mid-gray text-sm">Organize and compare homes</p>
          </div>
        </Link>

        <Link
          href="/portal/messages"
          className="bg-white p-6 flex items-center gap-4 border border-navy/10 hover:border-gold/30 transition-colors"
        >
          <svg className="w-8 h-8 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <div>
            <p className="font-semibold text-navy">Messages</p>
            <p className="text-mid-gray text-sm">Chat with your agent</p>
          </div>
        </Link>
      </div>

      {/* What's new / tips */}
      <div className="bg-white p-6 border border-navy/10">
        <h2 className="text-lg font-semibold text-navy mb-4">Getting Started</h2>
        <div className="space-y-3">
          {[
            { text: "Search for homes with SuperSearch — we show more listings than Zillow", href: "/search", done: (data?.savedCount ?? 0) > 0 },
            { text: "Save homes you like to compare later", href: "/search", done: (data?.savedCount ?? 0) > 0 },
            { text: "Create a Collection to organize your favorites", href: "/portal/collections", done: (data?.collectionsCount ?? 0) > 0 },
            { text: "Request a showing on any property", href: "/portal/showings", done: (data?.pendingShowings ?? 0) > 0 },
            { text: "Message your agent about properties you're interested in", href: "/portal/messages", done: false },
          ].map((step) => (
            <Link
              key={step.text}
              href={step.href}
              className="flex items-center gap-3 text-sm hover:text-gold transition-colors"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                step.done ? "border-gold bg-gold" : "border-navy/20"
              }`}>
                {step.done && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={step.done ? "text-mid-gray line-through" : "text-navy"}>{step.text}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
