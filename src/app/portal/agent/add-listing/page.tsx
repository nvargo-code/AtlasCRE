"use client";

import { useState } from "react";
import Link from "next/link";

export default function AddListingPage() {
  const [form, setForm] = useState({
    address: "", city: "Austin", zip: "", propertyType: "Residential",
    listingType: "Sale", searchMode: "residential",
    priceAmount: "", beds: "", baths: "", buildingSf: "",
    lotSizeAcres: "", yearBuilt: "", description: "",
    brokerName: "", brokerPhone: "", imageUrl: "", source: "verbal",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; address: string } | null>(null);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!form.address) return;
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/portal/add-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setResult(data.listing);
    }
    setLoading(false);
  }

  if (result) {
    return (
      <div className="p-6 md:p-10 max-w-[800px] mx-auto">
        <div className="bg-green-50 border border-green-200 p-10 text-center">
          <div className="text-green-600 text-4xl mb-4">&#10003;</div>
          <h2 className="text-xl font-semibold text-navy mb-2">Listing Added</h2>
          <p className="text-mid-gray text-sm mb-6">
            {result.address} is now live in SuperSearch.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href={`/listings/${result.id}`} className="bg-navy text-white px-5 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase">
              View Listing
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setForm({ ...form, address: "", zip: "", priceAmount: "", beds: "", baths: "", buildingSf: "", description: "", brokerName: "", brokerPhone: "", imageUrl: "" });
              }}
              className="border border-navy/20 text-navy px-5 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase"
            >
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-[800px] mx-auto">
      <div className="mb-8">
        <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Agent Tools</p>
        <h1 className="text-2xl md:text-3xl font-light text-navy">
          Quick-Add <span className="font-semibold">Listing</span>
        </h1>
        <p className="text-mid-gray text-sm mt-2">
          Heard about a pocket listing? Saw something on Instagram? Add it to SuperSearch in 30 seconds.
        </p>
      </div>

      <div className="bg-white border border-navy/10 p-6 space-y-4">
        {/* Source */}
        <div>
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">How did you find this?</label>
          <div className="flex gap-2">
            {[
              { value: "verbal", label: "Verbal / Networking" },
              { value: "social", label: "Social Media" },
              { value: "email", label: "Email / Blast" },
              { value: "sign", label: "Saw a Sign" },
              { value: "other", label: "Other" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => set("source", opt.value)}
                className={`px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                  form.source === opt.value ? "bg-gold text-white" : "bg-warm-gray text-navy/50 hover:text-navy"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Address *</label>
            <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">ZIP</label>
            <input type="text" value={form.zip} onChange={(e) => set("zip", e.target.value)} placeholder="78704" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
        </div>

        {/* Property details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Price</label>
            <input type="number" value={form.priceAmount} onChange={(e) => set("priceAmount", e.target.value)} placeholder="550000" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Beds</label>
            <input type="number" value={form.beds} onChange={(e) => set("beds", e.target.value)} placeholder="3" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Baths</label>
            <input type="number" value={form.baths} onChange={(e) => set("baths", e.target.value)} placeholder="2" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Sqft</label>
            <input type="number" value={form.buildingSf} onChange={(e) => set("buildingSf", e.target.value)} placeholder="2000" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Type</label>
            <select value={form.searchMode} onChange={(e) => set("searchMode", e.target.value)} className="w-full border border-navy/15 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gold">
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Listing Type</label>
            <select value={form.listingType} onChange={(e) => set("listingType", e.target.value)} className="w-full border border-navy/15 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gold">
              <option value="Sale">For Sale</option>
              <option value="Lease">For Lease</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Year Built</label>
            <input type="number" value={form.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)} placeholder="2005" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
        </div>

        {/* Broker info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Listing Agent</label>
            <input type="text" value={form.brokerName} onChange={(e) => set("brokerName", e.target.value)} placeholder="Agent name (if known)" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Agent Phone</label>
            <input type="tel" value={form.brokerPhone} onChange={(e) => set("brokerPhone", e.target.value)} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Notes / Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Any details you know..." className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold resize-none" />
        </div>

        <button
          onClick={submit}
          disabled={!form.address || loading}
          className="bg-navy text-white px-8 py-3 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90 disabled:opacity-50 w-full"
        >
          {loading ? "Adding..." : "Add to SuperSearch"}
        </button>
      </div>
    </div>
  );
}
