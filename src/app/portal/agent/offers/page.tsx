"use client";

import { useEffect, useState } from "react";

interface OfferItem {
  id: string;
  offerPrice: number;
  buyerName: string;
  buyerAgent: string | null;
  buyerPreApproved: boolean;
  financingType: string;
  earnestMoney: number | null;
  closingDate: string | null;
  optionPeriod: number | null;
  optionFee: number | null;
  contingencies: string | null;
  escalationClause: number | null;
  status: string;
  counterPrice: number | null;
  respondBy: string | null;
  notes: string | null;
  createdAt: string;
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

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

const STATUS_STYLES: Record<string, string> = {
  received: "bg-blue-50 text-blue-700",
  reviewing: "bg-amber-50 text-amber-700",
  countered: "bg-purple-50 text-purple-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
  expired: "bg-navy/5 text-navy/40",
  withdrawn: "bg-navy/5 text-navy/40",
};

export default function OffersPage() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    listingId: "", offerPrice: "", buyerName: "", buyerAgent: "",
    buyerPreApproved: false, financingType: "conventional",
    earnestMoney: "", closingDate: "", optionPeriod: "10", optionFee: "",
    contingencies: "", notes: "",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [offRes, listRes] = await Promise.all([
      fetch("/api/portal/offers"),
      fetch("/api/listings?limit=20&searchMode=residential"),
    ]);
    if (offRes.ok) {
      const data = await offRes.json();
      setOffers((data.offers || []).map((o: OfferItem) => ({
        ...o,
        offerPrice: Number(o.offerPrice),
        earnestMoney: o.earnestMoney ? Number(o.earnestMoney) : null,
        counterPrice: o.counterPrice ? Number(o.counterPrice) : null,
        escalationClause: o.escalationClause ? Number(o.escalationClause) : null,
      })));
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

  async function createOffer() {
    if (!form.listingId || !form.offerPrice || !form.buyerName) return;
    await fetch("/api/portal/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ listingId: "", offerPrice: "", buyerName: "", buyerAgent: "", buyerPreApproved: false, financingType: "conventional", earnestMoney: "", closingDate: "", optionPeriod: "10", optionFee: "", contingencies: "", notes: "" });
    loadData();
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/portal/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  }

  const activeOffers = offers.filter((o) => ["received", "reviewing", "countered"].includes(o.status));
  const resolvedOffers = offers.filter((o) => !["received", "reviewing", "countered"].includes(o.status));

  if (loading) {
    return <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Agent Tools</p>
          <h1 className="text-2xl md:text-3xl font-light text-navy">
            Offer <span className="font-semibold">Management</span>
          </h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-navy text-white px-5 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90">
          {showForm ? "Cancel" : "+ Log Offer"}
        </button>
      </div>

      {/* New Offer Form */}
      {showForm && (
        <div className="bg-white border border-navy/10 p-6 mb-8">
          <h2 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Log Incoming Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Listing</label>
              <select value={form.listingId} onChange={(e) => setForm({ ...form, listingId: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gold">
                <option value="">Select...</option>
                {listings.map((l) => <option key={l.id} value={l.id}>{l.address}, {l.city}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Offer Price</label>
              <input type="number" value={form.offerPrice} onChange={(e) => setForm({ ...form, offerPrice: e.target.value })} placeholder="550000" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Buyer Name</label>
              <input type="text" value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} placeholder="John Smith" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Buyer Agent</label>
              <input type="text" value={form.buyerAgent} onChange={(e) => setForm({ ...form, buyerAgent: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Financing</label>
              <select value={form.financingType} onChange={(e) => setForm({ ...form, financingType: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gold">
                <option value="conventional">Conventional</option>
                <option value="fha">FHA</option>
                <option value="va">VA</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Earnest $</label>
              <input type="number" value={form.earnestMoney} onChange={(e) => setForm({ ...form, earnestMoney: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Close Date</label>
              <input type="date" value={form.closingDate} onChange={(e) => setForm({ ...form, closingDate: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Option Days</label>
              <input type="number" value={form.optionPeriod} onChange={(e) => setForm({ ...form, optionPeriod: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm text-navy cursor-pointer">
              <input type="checkbox" checked={form.buyerPreApproved} onChange={(e) => setForm({ ...form, buyerPreApproved: e.target.checked })} className="accent-gold" />
              Buyer Pre-Approved
            </label>
          </div>
          <button onClick={createOffer} disabled={!form.listingId || !form.offerPrice || !form.buyerName} className="bg-gold text-white px-6 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-gold-dark disabled:opacity-50">
            Log Offer
          </button>
        </div>
      )}

      {/* Active Offers */}
      <h2 className="text-lg font-semibold text-navy mb-4">Active Offers ({activeOffers.length})</h2>
      {activeOffers.length > 0 ? (
        <div className="space-y-3 mb-10">
          {activeOffers.map((offer) => {
            const listPrice = offer.listing.priceAmount ? Number(offer.listing.priceAmount) : 0;
            const pctOfList = listPrice > 0 ? Math.round((offer.offerPrice / listPrice) * 100) : 0;

            return (
              <div key={offer.id} className="bg-white border border-navy/10 p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {offer.listing.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={offer.listing.imageUrl} alt="" className="w-full md:w-20 h-16 object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 ${STATUS_STYLES[offer.status] || "bg-navy/5 text-navy/40"}`}>
                        {offer.status}
                      </span>
                      <span className="text-sm font-semibold text-navy">{offer.listing.address}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-mid-gray">Offer: </span>
                        <span className="font-bold text-gold">{fmt(offer.offerPrice)}</span>
                        {pctOfList > 0 && <span className="text-[11px] text-mid-gray ml-1">({pctOfList}% of list)</span>}
                      </div>
                      <div>
                        <span className="text-mid-gray">From: </span>
                        <span className="text-navy">{offer.buyerName}</span>
                      </div>
                      <div>
                        <span className="text-mid-gray">Financing: </span>
                        <span className={`text-navy ${offer.financingType === "cash" ? "font-semibold text-green-700" : ""}`}>{offer.financingType}</span>
                      </div>
                      {offer.buyerPreApproved && (
                        <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5">Pre-Approved</span>
                      )}
                    </div>
                    {offer.respondBy && (
                      <p className="text-[11px] text-red-500 mt-1">Respond by: {new Date(offer.respondBy).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => updateStatus(offer.id, "accepted")} className="text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100">Accept</button>
                    <button onClick={() => updateStatus(offer.id, "countered")} className="text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100">Counter</button>
                    <button onClick={() => updateStatus(offer.id, "rejected")} className="text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100">Reject</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-navy/10 p-8 text-center mb-10">
          <p className="text-mid-gray text-sm">No active offers. Click &quot;+ Log Offer&quot; when an offer comes in.</p>
        </div>
      )}

      {/* Resolved Offers */}
      {resolvedOffers.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-navy mb-4">Resolved ({resolvedOffers.length})</h2>
          <div className="space-y-2">
            {resolvedOffers.map((offer) => (
              <div key={offer.id} className="bg-white border border-navy/10 p-4 flex items-center gap-4 opacity-60">
                <span className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 ${STATUS_STYLES[offer.status] || ""}`}>{offer.status}</span>
                <span className="text-sm text-navy flex-1">{offer.listing.address} — {fmt(offer.offerPrice)} from {offer.buyerName}</span>
                <span className="text-[11px] text-mid-gray">{new Date(offer.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
