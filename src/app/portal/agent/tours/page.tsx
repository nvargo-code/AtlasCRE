"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ShowingForTour {
  id: string;
  status: string;
  preferredDate: string | null;
  preferredTime: string | null;
  listing: {
    id: string;
    address: string;
    city: string;
    priceAmount: number | null;
    beds: number | null;
    baths: number | null;
    imageUrl: string | null;
    lat?: number;
    lng?: number;
  };
  client: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

export default function TourPlannerPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const [showings, setShowings] = useState<ShowingForTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [tourDate, setTourDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => { loadShowings(); }, []);

  async function loadShowings() {
    setLoading(true);
    const res = await fetch("/api/portal/showings");
    if (res.ok) {
      const data = await res.json();
      setShowings(
        (data.showings || []).filter(
          (s: ShowingForTour) => s.status === "requested" || s.status === "confirmed"
        )
      );
    }
    setLoading(false);
  }

  function toggleSelected(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function confirmTour() {
    for (const id of selectedIds) {
      await fetch("/api/portal/showings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showingId: id, status: "confirmed" }),
      });
    }
    loadShowings();
    setSelectedIds(new Set());
  }

  const selected = showings.filter((s) => selectedIds.has(s.id));

  if (userRole !== "AGENT" && userRole !== "ADMIN") {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-semibold text-navy mb-2">Agent Access Required</h1>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <Link href="/portal/agent" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark mb-2 inline-block">
          &larr; Agent Dashboard
        </Link>
        <h1 className="text-2xl font-light text-navy">
          Tour <span className="font-semibold">Planner</span>
        </h1>
        <p className="text-mid-gray text-sm mt-1">
          Select showing requests to build a tour itinerary.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        {/* Pending showings */}
        <div>
          <h2 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-4">
            Pending Requests ({showings.length})
          </h2>

          {loading ? (
            <div className="text-mid-gray text-center py-12">Loading...</div>
          ) : showings.length === 0 ? (
            <div className="text-center py-12 bg-white border border-navy/10">
              <p className="text-mid-gray text-sm">No pending showing requests.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {showings.map((showing) => (
                <div
                  key={showing.id}
                  onClick={() => toggleSelected(showing.id)}
                  className={`bg-white border p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                    selectedIds.has(showing.id) ? "border-gold bg-gold/5" : "border-navy/10 hover:border-navy/20"
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                    selectedIds.has(showing.id) ? "border-gold bg-gold" : "border-navy/20"
                  }`}>
                    {selectedIds.has(showing.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Listing image */}
                  {showing.listing.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={showing.listing.imageUrl} alt="" className="w-14 h-14 object-cover flex-shrink-0" />
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy text-sm truncate">{showing.listing.address}</p>
                    <p className="text-[12px] text-mid-gray">{showing.listing.city}</p>
                    <p className="text-[12px] text-navy/50 mt-0.5">
                      {showing.listing.priceAmount ? `$${showing.listing.priceAmount.toLocaleString()}` : "Contact"}
                      {showing.listing.beds && ` · ${showing.listing.beds}bd`}
                      {showing.listing.baths && ` ${showing.listing.baths}ba`}
                    </p>
                  </div>

                  {/* Client + date */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] text-navy">{showing.client.name || showing.client.email}</p>
                    {showing.preferredDate && (
                      <p className="text-[11px] text-mid-gray">
                        {new Date(showing.preferredDate).toLocaleDateString()}
                        {showing.preferredTime && ` · ${showing.preferredTime}`}
                      </p>
                    )}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      showing.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {showing.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tour builder sidebar */}
        <div className="bg-white border border-navy/10 p-6 h-fit sticky top-6">
          <h2 className="font-semibold text-navy mb-4">
            Build Tour ({selected.length} homes)
          </h2>

          {selected.length === 0 ? (
            <p className="text-mid-gray text-sm">
              Select showing requests from the left to build a tour itinerary.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Tour date */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                  Tour Date
                </label>
                <input
                  type="date"
                  value={tourDate}
                  onChange={(e) => setTourDate(e.target.value)}
                  className="w-full border border-navy/15 px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
                />
              </div>

              {/* Itinerary */}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
                  Itinerary
                </label>
                <div className="space-y-2">
                  {selected.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-gold text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-navy truncate">{s.listing.address}</p>
                        <p className="text-[11px] text-mid-gray">{s.client.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map link */}
              {selected.length >= 2 && (
                <a
                  href={`https://www.google.com/maps/dir/${selected.map((s) => encodeURIComponent(s.listing.address + ", " + s.listing.city + ", TX")).join("/")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 text-[12px] font-semibold tracking-[0.1em] uppercase text-navy border border-navy/15 hover:border-gold/30 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Open Route in Google Maps
                </a>
              )}

              {/* Confirm all */}
              <button
                onClick={confirmTour}
                className="btn-primary w-full"
              >
                Confirm {selected.length} Showings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
