"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface ShowingFeedback {
  id: string;
  status: string;
  preferredDate: string | null;
  rating: number | null;
  feedback: string | null;
  wouldOffer: boolean | null;
  client: { name: string | null };
  createdAt: string;
}

interface SellerListing {
  id: string;
  address: string;
  city: string;
  zip: string | null;
  priceAmount: number | null;
  beds: number | null;
  baths: number | null;
  buildingSf: number | null;
  imageUrl: string | null;
  status: string;
  stats: {
    totalViews: number;
    weekViews: number;
    totalSaves: number;
    weekSaves: number;
    daysOnMarket: number;
    showingsTotal: number;
    showingsCompleted: number;
    avgRating: number | null;
    wouldOfferCount: number;
  };
  showings: ShowingFeedback[];
  priceHistory: { event: string; oldValue: string | null; newValue: string; changeDate: string }[];
  activityByDay: { date: string; views: number; saves: number }[];
}

function formatPrice(n: number | null) {
  if (!n) return "—";
  return `$${n.toLocaleString()}`;
}

const GOLD = "#c9a96e";
const NAVY = "#0a1628";

export default function SellerDashboard() {
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SellerListing | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/portal/seller");
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
        if (data.listings?.length > 0) setSelected(data.listings[0]);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-mid-gray text-sm">Loading seller dashboard...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="text-2xl font-light text-navy mb-2">Seller <span className="font-semibold">Dashboard</span></h1>
        <div className="bg-white border border-navy/10 p-16 text-center mt-8">
          <svg className="w-12 h-12 text-navy/15 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a2 2 0 002 2h2a2 2 0 002-2m-6 0V14" />
          </svg>
          <h3 className="text-lg font-semibold text-navy mb-2">No Active Listings</h3>
          <p className="text-mid-gray text-sm">When your property is listed, you&apos;ll see activity, showings, and feedback here.</p>
        </div>
      </div>
    );
  }

  const l = selected!;
  const s = l.stats;

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-light text-navy">
          Seller <span className="font-semibold">Dashboard</span>
        </h1>
        <p className="text-mid-gray text-sm mt-1">Track your listing&apos;s performance in real time.</p>
      </div>

      {/* Listing selector (if multiple) */}
      {listings.length > 1 && (
        <div className="flex gap-2 mb-6">
          {listings.map((li) => (
            <button
              key={li.id}
              onClick={() => setSelected(li)}
              className={`px-4 py-2 text-sm transition-colors ${
                selected?.id === li.id ? "bg-navy text-white" : "bg-white border border-navy/10 text-navy/50"
              }`}
            >
              {li.address}
            </button>
          ))}
        </div>
      )}

      {/* Listing Header */}
      <div className="bg-white border border-navy/10 p-6 mb-6 flex flex-col md:flex-row gap-6">
        {l.imageUrl && (
          <div className="w-full md:w-56 h-40 flex-shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.imageUrl} alt={l.address} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-navy">{l.address}</h2>
              <p className="text-mid-gray text-sm">{l.city}, TX {l.zip}</p>
            </div>
            <span className={`text-[10px] font-semibold tracking-wider uppercase px-3 py-1 ${
              l.status === "active" ? "bg-green-50 text-green-700" : "bg-navy/5 text-navy/50"
            }`}>
              {l.status}
            </span>
          </div>
          <p className="text-2xl font-bold text-navy mt-3">{formatPrice(l.priceAmount)}</p>
          <div className="flex gap-4 text-sm text-mid-gray mt-1">
            {l.beds && <span>{l.beds} bed</span>}
            {l.baths && <span>{l.baths} bath</span>}
            {l.buildingSf && <span>{l.buildingSf.toLocaleString()} SF</span>}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <StatCard label="Total Views" value={s.totalViews} />
        <StatCard label="Views/Week" value={s.weekViews} highlight />
        <StatCard label="Total Saves" value={s.totalSaves} />
        <StatCard label="Saves/Week" value={s.weekSaves} highlight />
        <StatCard label="Days on Market" value={s.daysOnMarket} />
        <StatCard label="Showings" value={s.showingsTotal} />
        <StatCard label="Avg Rating" value={s.avgRating ? `${s.avgRating}/5` : "—"} />
        <StatCard label="Would Offer" value={s.wouldOfferCount} highlight />
      </div>

      {/* Activity Chart */}
      {l.activityByDay.length > 0 && (
        <div className="bg-white border border-navy/10 p-6 mb-6">
          <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">30-Day Activity</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={l.activityByDay} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="sellerGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                <YAxis tick={{ fontSize: 10 }} width={30} />
                <Tooltip />
                <Area type="monotone" dataKey="views" name="Views" stroke={NAVY} strokeWidth={1.5} fill="url(#sellerGold)" />
                <Area type="monotone" dataKey="saves" name="Saves" stroke={GOLD} strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Showing Feedback */}
        <div className="bg-white border border-navy/10 p-6">
          <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Showing Feedback</h3>
          {l.showings.length > 0 ? (
            <div className="space-y-3">
              {l.showings.map((showing) => (
                <div key={showing.id} className="p-4 bg-warm-gray">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 ${
                        showing.status === "completed" ? "bg-green-50 text-green-700" :
                        showing.status === "confirmed" ? "bg-blue-50 text-blue-700" :
                        "bg-navy/5 text-navy/50"
                      }`}>
                        {showing.status}
                      </span>
                      {showing.client.name && (
                        <span className="text-[11px] text-navy/50">{showing.client.name}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-mid-gray">
                      {new Date(showing.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {showing.rating && (
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`w-4 h-4 ${star <= showing.rating! ? "text-gold" : "text-navy/10"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      {showing.wouldOffer && (
                        <span className="text-[9px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 ml-2">Would Offer</span>
                      )}
                    </div>
                  )}
                  {showing.feedback && (
                    <p className="text-sm text-navy/70 mt-1">&ldquo;{showing.feedback}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-mid-gray text-sm text-center py-6">No showings yet.</p>
          )}
        </div>

        {/* Price History */}
        <div className="bg-white border border-navy/10 p-6">
          <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Price History</h3>
          {l.priceHistory.length > 0 ? (
            <div className="space-y-2">
              {l.priceHistory.map((event) => (
                <div key={event.changeDate} className="flex items-center gap-3 p-3 bg-warm-gray">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    event.event === "price_change" ? "bg-gold" :
                    event.event === "status_change" ? "bg-blue-500" :
                    "bg-green-500"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-navy">
                      {event.event === "price_change" ? (
                        <>Price changed from <s className="text-mid-gray">{event.oldValue}</s> to <strong>{event.newValue}</strong></>
                      ) : event.event === "status_change" ? (
                        <>Status: {event.oldValue} → <strong>{event.newValue}</strong></>
                      ) : (
                        <>Listed at <strong>{event.newValue}</strong></>
                      )}
                    </p>
                  </div>
                  <span className="text-[11px] text-mid-gray flex-shrink-0">
                    {new Date(event.changeDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-mid-gray text-sm text-center py-6">No price changes recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-white border border-navy/10 p-4 text-center">
      <p className={`text-xl font-bold ${highlight ? "text-gold" : "text-navy"}`}>{value}</p>
      <p className="text-[9px] font-semibold tracking-[0.1em] uppercase text-mid-gray mt-1">{label}</p>
    </div>
  );
}
