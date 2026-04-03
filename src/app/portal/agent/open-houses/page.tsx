"use client";

import { useEffect, useState } from "react";

interface OpenHouseItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  status: string;
  rsvpCount: number;
  listing: {
    id: string;
    address: string;
    city: string;
    priceAmount: number | null;
    imageUrl: string | null;
  };
}

interface ListingOption {
  id: string;
  address: string;
  city: string;
  priceAmount: number | null;
}

export default function OpenHousesPage() {
  const [openHouses, setOpenHouses] = useState<OpenHouseItem[]>([]);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ listingId: "", date: "", startTime: "1:00 PM", endTime: "4:00 PM", notes: "" });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [ohRes, listRes] = await Promise.all([
      fetch("/api/portal/open-houses"),
      fetch("/api/listings?limit=20&searchMode=residential"),
    ]);
    if (ohRes.ok) {
      const data = await ohRes.json();
      setOpenHouses(data.openHouses || []);
    }
    if (listRes.ok) {
      const data = await listRes.json();
      setListings((data.listings || []).map((l: ListingOption) => ({
        id: l.id, address: l.address, city: l.city,
        priceAmount: l.priceAmount ? Number(l.priceAmount) : null,
      })));
    }
    setLoading(false);
  }

  async function createOpenHouse() {
    if (!form.listingId || !form.date) return;
    await fetch("/api/portal/open-houses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ listingId: "", date: "", startTime: "1:00 PM", endTime: "4:00 PM", notes: "" });
    loadData();
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/portal/open-houses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setOpenHouses((prev) => prev.map((oh) => oh.id === id ? { ...oh, status } : oh));
  }

  const upcoming = openHouses.filter((oh) => oh.status === "scheduled" && new Date(oh.date) >= new Date());
  const past = openHouses.filter((oh) => oh.status !== "scheduled" || new Date(oh.date) < new Date());

  if (loading) {
    return <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Agent Tools</p>
          <h1 className="text-2xl md:text-3xl font-light text-navy">
            Open <span className="font-semibold">Houses</span>
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy text-white px-5 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90"
        >
          {showForm ? "Cancel" : "+ Schedule"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-navy/10 p-6 mb-8">
          <h2 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">New Open House</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Listing</label>
              <select value={form.listingId} onChange={(e) => setForm({ ...form, listingId: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gold">
                <option value="">Select listing...</option>
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>{l.address}, {l.city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Start</label>
                <select value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full border border-navy/15 px-2 py-2.5 text-sm bg-white focus:outline-none focus:border-gold">
                  {["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">End</label>
                <select value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full border border-navy/15 px-2 py-2.5 text-sm bg-white focus:outline-none focus:border-gold">
                  {["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <button onClick={createOpenHouse} disabled={!form.listingId || !form.date} className="bg-gold text-white px-6 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-gold-dark disabled:opacity-50">
            Schedule Open House
          </button>
        </div>
      )}

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-navy mb-4">Upcoming</h2>
        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((oh) => (
              <div key={oh.id} className="bg-white border border-navy/10 p-5 flex flex-col md:flex-row md:items-center gap-4">
                {oh.listing.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={oh.listing.imageUrl} alt="" className="w-full md:w-24 h-20 object-cover flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-navy">{oh.listing.address}</h3>
                  <p className="text-[12px] text-mid-gray">{oh.listing.city} {oh.listing.priceAmount ? `— $${Number(oh.listing.priceAmount).toLocaleString()}` : ""}</p>
                  <p className="text-sm text-gold font-semibold mt-1">
                    {new Date(oh.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} &middot; {oh.startTime} — {oh.endTime}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => updateStatus(oh.id, "completed")}
                    className="text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => updateStatus(oh.id, "cancelled")}
                    className="text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-navy/10 p-8 text-center">
            <p className="text-mid-gray text-sm">No upcoming open houses. Click &quot;+ Schedule&quot; to create one.</p>
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy mb-4">Past</h2>
          <div className="space-y-2">
            {past.map((oh) => (
              <div key={oh.id} className="bg-white border border-navy/10 p-4 flex items-center gap-4 opacity-60">
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy">{oh.listing.address}</p>
                  <p className="text-[11px] text-mid-gray">
                    {new Date(oh.date).toLocaleDateString()} &middot; {oh.startTime} — {oh.endTime}
                  </p>
                </div>
                <span className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 ${
                  oh.status === "completed" ? "bg-green-50 text-green-700" :
                  oh.status === "cancelled" ? "bg-red-50 text-red-600" :
                  "bg-navy/5 text-navy/40"
                }`}>{oh.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
