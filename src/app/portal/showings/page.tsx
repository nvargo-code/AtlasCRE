"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Showing {
  id: string;
  status: string;
  preferredDate: string | null;
  preferredTime: string | null;
  rating: number | null;
  feedback: string | null;
  wouldOffer: boolean | null;
  createdAt: string;
  listing: {
    id: string; address: string; city: string;
    priceAmount: number | null; beds: number | null;
    baths: number | null; imageUrl: string | null;
  };
  agent: { id: string; name: string | null } | null;
  client: { id: string; name: string | null; email: string; phone: string | null };
}

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-navy/10 text-navy",
  cancelled: "bg-red-100 text-red-700",
};

export default function ShowingsPage() {
  const { data: session } = useSession();
  const isAgent = (session?.user as { role?: string })?.role === "AGENT" || (session?.user as { role?: string })?.role === "ADMIN";
  const [showings, setShowings] = useState<Showing[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState({ rating: 0, feedback: "", wouldOffer: false });

  async function updateShowingStatus(showingId: string, status: string) {
    await fetch("/api/portal/showings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showingId, status }),
    });
    loadShowings();
  }

  useEffect(() => { loadShowings(); }, []);

  async function loadShowings() {
    setLoading(true);
    const res = await fetch("/api/portal/showings");
    if (res.ok) {
      const data = await res.json();
      setShowings(data.showings || []);
    }
    setLoading(false);
  }

  async function submitFeedback(showingId: string) {
    await fetch("/api/portal/showings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        showingId,
        status: "completed",
        rating: feedbackData.rating,
        feedback: feedbackData.feedback,
        wouldOffer: feedbackData.wouldOffer,
      }),
    });
    setFeedbackId(null);
    setFeedbackData({ rating: 0, feedback: "", wouldOffer: false });
    loadShowings();
  }

  const grouped = {
    upcoming: showings.filter((s) => s.status === "requested" || s.status === "confirmed"),
    past: showings.filter((s) => s.status === "completed" || s.status === "cancelled"),
  };

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-navy">
          My <span className="font-semibold">Showings</span>
        </h1>
        <p className="text-mid-gray text-sm mt-1">
          Request tours on any listing. Your agent will confirm and schedule.
        </p>
      </div>

      {loading ? (
        <div className="text-mid-gray text-center py-16">Loading showings...</div>
      ) : showings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-navy/10">
          <svg className="w-12 h-12 text-navy/10 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-navy mb-2">No showings yet</h3>
          <p className="text-mid-gray text-sm mb-4">
            Browse homes and tap &ldquo;Request Showing&rdquo; to schedule a tour.
          </p>
          <Link href="/search" className="bg-gold text-white px-6 py-2.5 text-sm font-semibold hover:bg-gold-dark inline-block">
            Search Homes
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming */}
          {grouped.upcoming.length > 0 && (
            <div>
              <h2 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gold mb-4">
                Upcoming ({grouped.upcoming.length})
              </h2>
              <div className="space-y-3">
                {grouped.upcoming.map((showing) => (
                  <div key={showing.id} className="bg-white border border-navy/10 p-4 flex items-center gap-4">
                    {showing.listing.imageUrl && (
                      <Link href={`/listings/${showing.listing.id}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={showing.listing.imageUrl} alt="" className="w-16 h-16 object-cover flex-shrink-0" />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/listings/${showing.listing.id}`} className="font-semibold text-navy hover:text-gold transition-colors">
                        {showing.listing.address}
                      </Link>
                      <p className="text-[12px] text-mid-gray">{showing.listing.city}</p>
                      <p className="text-sm text-navy font-medium mt-0.5">
                        {showing.listing.priceAmount ? `$${showing.listing.priceAmount.toLocaleString()}` : "Contact"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[showing.status]}`}>
                        {showing.status}
                      </span>
                      {showing.preferredDate && (
                        <p className="text-[11px] text-mid-gray mt-1">
                          {new Date(showing.preferredDate).toLocaleDateString()}
                          {showing.preferredTime && ` · ${showing.preferredTime}`}
                        </p>
                      )}
                      {showing.agent?.name && (
                        <p className="text-[11px] text-gold mt-1">
                          Agent: {showing.agent.name}
                        </p>
                      )}
                      {/* Agent actions */}
                      {isAgent && showing.status === "requested" && (
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => updateShowingStatus(showing.id, "confirmed")}
                            className="text-[9px] font-semibold tracking-wider uppercase px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => updateShowingStatus(showing.id, "cancelled")}
                            className="text-[9px] font-semibold tracking-wider uppercase px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {isAgent && showing.status === "confirmed" && (
                        <button
                          onClick={() => updateShowingStatus(showing.id, "completed")}
                          className="text-[9px] font-semibold tracking-wider uppercase px-2 py-1 bg-navy/5 text-navy/50 hover:text-navy mt-2"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {grouped.past.length > 0 && (
            <div>
              <h2 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-4">
                Past Showings ({grouped.past.length})
              </h2>
              <div className="space-y-3">
                {grouped.past.map((showing) => (
                  <div key={showing.id} className="bg-white border border-navy/10 p-4">
                    <div className="flex items-center gap-4">
                      {showing.listing.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={showing.listing.imageUrl} alt="" className="w-12 h-12 object-cover flex-shrink-0 opacity-60" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-navy/60">{showing.listing.address}</p>
                        <p className="text-[11px] text-mid-gray">{new Date(showing.createdAt).toLocaleDateString()}</p>
                      </div>
                      {showing.rating ? (
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div key={star} className={`w-3 h-3 rounded-full ${star <= showing.rating! ? "bg-gold" : "bg-navy/10"}`} />
                          ))}
                        </div>
                      ) : showing.status === "completed" ? (
                        <button
                          onClick={() => setFeedbackId(showing.id)}
                          className="text-[11px] font-semibold text-gold hover:text-gold-dark"
                        >
                          Leave Feedback
                        </button>
                      ) : null}
                    </div>

                    {/* Feedback form */}
                    {feedbackId === showing.id && (
                      <div className="mt-4 pt-4 border-t border-navy/10 space-y-3">
                        <div>
                          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray mb-2">How was it?</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                                className={`w-8 h-8 rounded-full transition-colors ${
                                  star <= feedbackData.rating ? "bg-gold" : "bg-navy/10 hover:bg-gold/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={feedbackData.feedback}
                          onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                          placeholder="What did you think? Any concerns?"
                          className="w-full border border-navy/15 px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold resize-none"
                          rows={2}
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={feedbackData.wouldOffer}
                            onChange={(e) => setFeedbackData({ ...feedbackData, wouldOffer: e.target.checked })}
                            className="accent-gold"
                          />
                          <span className="text-navy">I would consider making an offer on this property</span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitFeedback(showing.id)}
                            className="bg-gold text-white px-4 py-1.5 text-sm font-semibold hover:bg-gold-dark"
                          >
                            Submit
                          </button>
                          <button onClick={() => setFeedbackId(null)} className="text-mid-gray text-sm px-3">Cancel</button>
                        </div>
                      </div>
                    )}

                    {showing.feedback && (
                      <p className="text-[12px] text-mid-gray mt-2 italic">&ldquo;{showing.feedback}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
