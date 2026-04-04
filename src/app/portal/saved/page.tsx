"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SavedHome {
  id: string;
  notes: string | null;
  createdAt: string;
  listing: {
    id: string; address: string; city: string; state: string;
    priceAmount: number | null; beds: number | null; baths: number | null;
    buildingSf: number | null; imageUrl: string | null; listingType: string;
    propSubType: string | null; status: string;
  };
}

export default function SavedHomesPage() {
  const [saved, setSaved] = useState<SavedHome[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSaved(); }, []);

  async function loadSaved() {
    setLoading(true);
    const res = await fetch("/api/favorites");
    if (res.ok) {
      const data = await res.json();
      setSaved(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }

  async function removeSaved(listingId: string) {
    await fetch(`/api/favorites/${listingId}`, { method: "DELETE" });
    setSaved(saved.filter((s) => s.listing.id !== listingId));
  }

  const [showingListingId, setShowingListingId] = useState<string | null>(null);
  const [showingRequested, setShowingRequested] = useState<Set<string>>(new Set());

  async function requestShowing(listingId: string) {
    const res = await fetch("/api/portal/showings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    if (res.ok) {
      setShowingRequested((prev) => new Set([...prev, listingId]));
      setShowingListingId(null);
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-navy">
            Saved <span className="font-semibold">Homes</span>
          </h1>
          <p className="text-mid-gray text-sm mt-1">
            {saved.length} {saved.length === 1 ? "home" : "homes"} saved
          </p>
        </div>
        <Link href="/search" className="bg-gold text-white px-4 py-2 text-[12px] font-semibold tracking-[0.1em] uppercase hover:bg-gold-dark transition-colors">
          + Find More
        </Link>
      </div>

      {loading ? (
        <div className="text-mid-gray text-center py-16">Loading saved homes...</div>
      ) : saved.length === 0 ? (
        <div className="text-center py-16 bg-white border border-navy/10">
          <svg className="w-12 h-12 text-navy/10 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-navy mb-2">No saved homes yet</h3>
          <p className="text-mid-gray text-sm mb-4">Search for homes and tap the heart to save them here.</p>
          <Link href="/search" className="bg-gold text-white px-6 py-2.5 text-sm font-semibold hover:bg-gold-dark inline-block">
            Start Searching
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {saved.map((item) => (
            <div key={item.id} className="bg-white border border-navy/10 flex overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <Link href={`/listings/${item.listing.id}`} className="w-32 md:w-48 flex-shrink-0 bg-navy/5">
                {item.listing.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.listing.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.classList.add("flex", "items-center", "justify-center", "min-h-[100px]"); (e.target as HTMLImageElement).insertAdjacentHTML("afterend", "<span class='text-mid-gray text-[11px]'>No Photo</span>"); }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center min-h-[100px]">
                    <span className="text-mid-gray text-[11px]">No Photo</span>
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <Link href={`/listings/${item.listing.id}`}>
                      <p className="text-lg font-semibold text-navy hover:text-gold transition-colors">
                        {item.listing.priceAmount ? `$${item.listing.priceAmount.toLocaleString()}` : "Contact"}
                      </p>
                      <p className="text-sm text-navy/70">{item.listing.address}</p>
                      <p className="text-[12px] text-mid-gray">{item.listing.city}, {item.listing.state}</p>
                    </Link>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 ${
                      item.listing.status === "active" ? "bg-green-100 text-green-700" : "bg-navy/10 text-navy/50"
                    }`}>
                      {item.listing.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[12px] text-mid-gray">
                    {item.listing.beds && <span>{item.listing.beds} bd</span>}
                    {item.listing.baths && <span>{item.listing.baths} ba</span>}
                    {item.listing.buildingSf && <span>{item.listing.buildingSf.toLocaleString()} SF</span>}
                    {item.listing.propSubType && <span>{item.listing.propSubType}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-navy/5">
                  {showingRequested.has(item.listing.id) ? (
                    <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-green-600">
                      Showing Requested &#10003;
                    </span>
                  ) : (
                    <button
                      onClick={() => requestShowing(item.listing.id)}
                      className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gold hover:text-gold-dark transition-colors"
                    >
                      Request Showing
                    </button>
                  )}
                  <Link
                    href={`/listings/${item.listing.id}`}
                    className="text-[11px] font-semibold tracking-[0.08em] uppercase text-navy/40 hover:text-navy transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => removeSaved(item.listing.id)}
                    className="text-[11px] font-semibold tracking-[0.08em] uppercase text-red-400 hover:text-red-600 transition-colors ml-auto"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
