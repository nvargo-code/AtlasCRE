"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { OnboardingModal } from "@/components/public/OnboardingModal";

interface RecommendedListing {
  id: string;
  address: string;
  city: string;
  priceAmount: number | null;
  beds: number | null;
  baths: number | null;
  buildingSf: number | null;
  imageUrl: string | null;
  listingType: string;
  reason: string;
}

function RecommendedHomes() {
  const [recs, setRecs] = useState<RecommendedListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/recommendations")
      .then((r) => r.ok ? r.json() : { recommendations: [] })
      .then((data) => setRecs(data.recommendations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || recs.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-navy">Recommended for You</h2>
        <Link href="/search" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark">
          View All &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {recs.slice(0, 4).map((listing) => (
          <Link key={listing.id} href={`/listings/${listing.id}`} className="bg-white overflow-hidden hover:shadow-md transition-shadow group">
            <div className="aspect-[4/3] bg-navy/5 relative overflow-hidden">
              {listing.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listing.imageUrl} alt={listing.address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-mid-gray text-[11px]">No Photo</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-navy group-hover:text-gold transition-colors">
                {listing.priceAmount ? `$${listing.priceAmount.toLocaleString()}` : "Contact"}
              </p>
              <p className="text-[12px] text-navy/70 truncate">{listing.address}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-mid-gray">
                {listing.beds && <span>{listing.beds}bd</span>}
                {listing.baths && <span>{listing.baths}ba</span>}
                {listing.buildingSf && <span>{listing.buildingSf.toLocaleString()}SF</span>}
              </div>
              <p className="text-[10px] text-gold mt-1.5">{listing.reason}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

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
      <OnboardingModal />

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

      {/* Recommended homes */}
      <RecommendedHomes />

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
