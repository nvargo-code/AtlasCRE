"use client";

import { useEffect, useState } from "react";

interface ReferralItem {
  id: string;
  referringAgent: string;
  referringBrokerage: string | null;
  referringEmail: string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientType: string;
  referralFee: number | null;
  estimatedPrice: number | null;
  status: string;
  closedPrice: number | null;
  paidAmount: number | null;
  notes: string | null;
  createdAt: string;
}

interface ReferralStats {
  total: number;
  active: number;
  closed: number;
  totalPaid: number;
  pendingFees: number;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

const STATUS_STYLES: Record<string, string> = {
  received: "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  active: "bg-green-50 text-green-700",
  closed: "bg-gold/10 text-gold",
  lost: "bg-navy/5 text-navy/40",
};

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    referringAgent: "", referringBrokerage: "", referringEmail: "", referringPhone: "",
    clientName: "", clientEmail: "", clientPhone: "", clientType: "buyer",
    referralFee: "25", estimatedPrice: "", notes: "",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/portal/referrals");
    if (res.ok) {
      const data = await res.json();
      setReferrals(data.referrals || []);
      setStats(data.stats || null);
    }
    setLoading(false);
  }

  async function createReferral() {
    if (!form.referringAgent || !form.clientName) return;
    await fetch("/api/portal/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ referringAgent: "", referringBrokerage: "", referringEmail: "", referringPhone: "", clientName: "", clientEmail: "", clientPhone: "", clientType: "buyer", referralFee: "25", estimatedPrice: "", notes: "" });
    loadData();
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/portal/referrals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setReferrals((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }

  if (loading) {
    return <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Agent Tools</p>
          <h1 className="text-2xl md:text-3xl font-light text-navy">
            Referral <span className="font-semibold">Network</span>
          </h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-navy text-white px-5 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90">
          {showForm ? "Cancel" : "+ New Referral"}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-white border border-navy/10 p-5 text-center">
            <p className="text-2xl font-bold text-navy">{stats.total}</p>
            <p className="text-[9px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Total Referrals</p>
          </div>
          <div className="bg-white border border-navy/10 p-5 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            <p className="text-[9px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Active</p>
          </div>
          <div className="bg-white border border-navy/10 p-5 text-center">
            <p className="text-2xl font-bold text-gold">{stats.closed}</p>
            <p className="text-[9px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Closed</p>
          </div>
          <div className="bg-white border border-navy/10 p-5 text-center">
            <p className="text-2xl font-bold text-navy">{stats.totalPaid > 0 ? fmt(stats.totalPaid) : "—"}</p>
            <p className="text-[9px] font-semibold tracking-wider uppercase text-mid-gray mt-1">Fees Paid</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-navy/10 p-6 mb-8">
          <h2 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Log New Referral</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Referring Agent *</label>
              <input type="text" value={form.referringAgent} onChange={(e) => setForm({ ...form, referringAgent: e.target.value })} placeholder="Jane Smith" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Their Brokerage</label>
              <input type="text" value={form.referringBrokerage} onChange={(e) => setForm({ ...form, referringBrokerage: e.target.value })} placeholder="Compass / Keller Williams" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Client Name *</label>
              <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Client Email</label>
              <input type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Client Type</label>
              <select value={form.clientType} onChange={(e) => setForm({ ...form, clientType: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gold">
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Referral Fee %</label>
              <input type="number" value={form.referralFee} onChange={(e) => setForm({ ...form, referralFee: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Est. Deal Price</label>
              <input type="number" value={form.estimatedPrice} onChange={(e) => setForm({ ...form, estimatedPrice: e.target.value })} placeholder="550000" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
          </div>
          <button onClick={createReferral} disabled={!form.referringAgent || !form.clientName} className="bg-gold text-white px-6 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-gold-dark disabled:opacity-50">
            Log Referral
          </button>
        </div>
      )}

      {/* Referral list */}
      {referrals.length > 0 ? (
        <div className="space-y-3">
          {referrals.map((ref) => (
            <div key={ref.id} className="bg-white border border-navy/10 p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 ${STATUS_STYLES[ref.status] || "bg-navy/5 text-navy/40"}`}>{ref.status}</span>
                    <span className="text-sm font-semibold text-navy">{ref.clientName}</span>
                    <span className="text-[11px] text-mid-gray">({ref.clientType})</span>
                  </div>
                  <p className="text-[12px] text-mid-gray">
                    From: <span className="text-navy">{ref.referringAgent}</span>
                    {ref.referringBrokerage && <span> — {ref.referringBrokerage}</span>}
                  </p>
                  <div className="flex gap-4 mt-1 text-[12px] text-mid-gray">
                    {ref.referralFee && <span>Fee: {ref.referralFee}%</span>}
                    {ref.estimatedPrice && <span>Est: {fmt(Number(ref.estimatedPrice))}</span>}
                    {ref.closedPrice && <span className="text-gold font-semibold">Closed: {fmt(Number(ref.closedPrice))}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {ref.status === "received" && (
                    <button onClick={() => updateStatus(ref.id, "contacted")} className="text-[9px] font-semibold tracking-wider uppercase px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100">Contacted</button>
                  )}
                  {["received", "contacted"].includes(ref.status) && (
                    <button onClick={() => updateStatus(ref.id, "active")} className="text-[9px] font-semibold tracking-wider uppercase px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100">Active</button>
                  )}
                  {ref.status === "active" && (
                    <>
                      <button onClick={() => updateStatus(ref.id, "closed")} className="text-[9px] font-semibold tracking-wider uppercase px-2 py-1 bg-gold/10 text-gold hover:bg-gold/20">Closed</button>
                      <button onClick={() => updateStatus(ref.id, "lost")} className="text-[9px] font-semibold tracking-wider uppercase px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100">Lost</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-navy/10 p-12 text-center">
          <h3 className="text-lg font-semibold text-navy mb-2">No Referrals Yet</h3>
          <p className="text-mid-gray text-sm">Click &quot;+ New Referral&quot; to log an incoming or outgoing referral.</p>
        </div>
      )}
    </div>
  );
}
