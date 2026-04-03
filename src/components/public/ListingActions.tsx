"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ListingActionsProps {
  listingId: string;
  address: string;
  city: string;
}

export function ListingActions({ listingId, address, city }: ListingActionsProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const [showingRequested, setShowingRequested] = useState(false);
  const [showingLoading, setShowingLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showingDate, setShowingDate] = useState("");
  const [showingTime, setShowingTime] = useState("afternoon");
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [addedToCollection, setAddedToCollection] = useState<string | null>(null);
  const [hotScore, setHotScore] = useState<{ score: number; reasoning: string } | null>(null);

  // Check if saved + load hot score
  useEffect(() => {
    if (isLoggedIn) {
      fetch(`/api/listings/${listingId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data?.isFavorited) setIsSaved(true); })
        .catch(() => {});
    }
    fetch(`/api/portal/hot-score/${listingId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.score !== undefined) setHotScore(data); })
      .catch(() => {});

    // Track view
    fetch("/api/portal/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, action: "view" }),
    }).catch(() => {});
  }, [listingId, isLoggedIn]);

  async function requestShowing() {
    if (!isLoggedIn) return;
    setShowingLoading(true);
    try {
      await fetch("/api/portal/showings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          preferredDate: showingDate || null,
          preferredTime: showingTime || null,
        }),
      });
      setShowingRequested(true);
    } catch {}
    setShowingLoading(false);
  }

  async function toggleSave() {
    if (!isLoggedIn) return;
    setSaveLoading(true);
    if (isSaved) {
      await fetch(`/api/favorites/${listingId}`, { method: "DELETE" });
      setIsSaved(false);
    } else {
      await fetch(`/api/favorites/${listingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setIsSaved(true);
      // Track save
      fetch("/api/portal/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, action: "save" }),
      }).catch(() => {});
    }
    setSaveLoading(false);
  }

  async function sendMessage() {
    if (!messageText.trim()) return;
    setMessageSending(true);
    try {
      await fetch("/api/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          subject: `Question about ${address}`,
          body: messageText,
        }),
      });
      setMessageSent(true);
      setMessageText("");
    } catch {}
    setMessageSending(false);
  }

  async function loadCollections() {
    const res = await fetch("/api/portal/collections");
    if (res.ok) {
      const data = await res.json();
      setCollections(data.collections?.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })) || []);
    }
    setShowCollectionPicker(true);
  }

  async function addToCollection(collectionId: string) {
    await fetch(`/api/portal/collections/${collectionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    setAddedToCollection(collectionId);
    setShowCollectionPicker(false);
  }

  return (
    <div className="bg-white p-6 md:p-8 h-fit space-y-4">
      {/* Hot Score */}
      {hotScore && (
        <div className={`p-4 ${hotScore.score >= 70 ? "bg-red-50 border border-red-200" : hotScore.score >= 40 ? "bg-orange-50 border border-orange-200" : "bg-navy/5 border border-navy/10"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray">
              Hot Score
            </span>
            <span className={`text-2xl font-bold ${hotScore.score >= 70 ? "text-red-600" : hotScore.score >= 40 ? "text-orange-600" : "text-navy"}`}>
              {hotScore.score >= 70 && "\uD83D\uDD25 "}{hotScore.score}
            </span>
          </div>
          <div className="w-full h-2 bg-navy/10 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full ${hotScore.score >= 70 ? "bg-red-500" : hotScore.score >= 40 ? "bg-orange-500" : "bg-navy/30"}`}
              style={{ width: `${hotScore.score}%` }}
            />
          </div>
          <p className="text-[11px] text-mid-gray leading-relaxed">
            {hotScore.reasoning}
          </p>
        </div>
      )}

      {isLoggedIn ? (
        <>
          {/* Request Showing */}
          {showingRequested ? (
            <div className="bg-green-50 border border-green-200 p-4 text-center">
              <p className="text-green-700 text-sm font-semibold">Showing Requested</p>
              <p className="text-green-600 text-[12px] mt-1">
                {showingDate ? `Preferred: ${new Date(showingDate).toLocaleDateString()} (${showingTime})` : "Your agent will confirm shortly."}
              </p>
            </div>
          ) : showDatePicker ? (
            <div className="space-y-3 p-4 bg-warm-gray border border-navy/10">
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-mid-gray">When would you like to tour?</p>
              <input
                type="date"
                value={showingDate}
                onChange={(e) => setShowingDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-navy/15 px-3 py-2 text-sm bg-white focus:outline-none focus:border-gold"
              />
              <div className="flex gap-1">
                {["morning", "afternoon", "evening"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setShowingTime(t)}
                    className={`flex-1 py-2 text-[10px] font-semibold tracking-wider uppercase ${
                      showingTime === t ? "bg-navy text-white" : "bg-white text-navy/50 hover:text-navy"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={requestShowing}
                  disabled={showingLoading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {showingLoading ? "Requesting..." : "Request Showing"}
                </button>
                <button onClick={() => setShowDatePicker(false)} className="text-mid-gray text-[11px] px-3">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDatePicker(true)}
              className="btn-primary w-full"
            >
              Request a Showing
            </button>
          )}

          {/* Save / Favorite */}
          <button
            onClick={toggleSave}
            disabled={saveLoading}
            className={`w-full py-3 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors flex items-center justify-center gap-2 ${
              isSaved
                ? "bg-gold/10 text-gold border border-gold/30"
                : "bg-white text-navy border border-navy/15 hover:border-gold/30"
            }`}
          >
            <svg className={`w-4 h-4 ${isSaved ? "fill-gold" : ""}`} fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {isSaved ? "Saved" : "Save Home"}
          </button>

          {/* Add to Collection */}
          {addedToCollection ? (
            <div className="text-center py-2">
              <p className="text-gold text-[12px] font-semibold">Added to Collection</p>
              <Link href={`/portal/collections/${addedToCollection}`} className="text-[11px] text-navy/50 hover:text-gold">
                View Collection &rarr;
              </Link>
            </div>
          ) : (
            <button
              onClick={loadCollections}
              className="w-full py-3 text-[12px] font-semibold tracking-[0.1em] uppercase text-navy border border-navy/15 hover:border-gold/30 transition-colors"
            >
              Add to Collection
            </button>
          )}

          {/* Collection picker dropdown */}
          {showCollectionPicker && (
            <div className="border border-navy/10 bg-warm-gray p-3 space-y-2">
              {collections.length === 0 ? (
                <div className="text-center py-2">
                  <p className="text-mid-gray text-[12px] mb-2">No collections yet</p>
                  <Link href="/portal/collections" className="text-gold text-[11px] font-semibold hover:text-gold-dark">
                    Create One &rarr;
                  </Link>
                </div>
              ) : (
                collections.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => addToCollection(col.id)}
                    className="w-full text-left px-3 py-2 bg-white hover:bg-gold/5 text-sm text-navy transition-colors"
                  >
                    {col.name}
                  </button>
                ))
              )}
              <button
                onClick={() => setShowCollectionPicker(false)}
                className="w-full text-[11px] text-mid-gray hover:text-navy py-1"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Message Agent */}
          {messageSent ? (
            <div className="text-center py-2">
              <p className="text-gold text-[12px] font-semibold">Message Sent</p>
              <Link href="/portal/messages" className="text-[11px] text-navy/50 hover:text-gold">
                View Messages &rarr;
              </Link>
            </div>
          ) : showMessageForm ? (
            <div className="space-y-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Ask about ${address}...`}
                rows={3}
                className="w-full border border-navy/15 px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={sendMessage}
                  disabled={messageSending || !messageText.trim()}
                  className="flex-1 bg-gold text-white py-2 text-[12px] font-semibold hover:bg-gold-dark disabled:opacity-50"
                >
                  {messageSending ? "Sending..." : "Send"}
                </button>
                <button
                  onClick={() => setShowMessageForm(false)}
                  className="text-mid-gray text-[12px] px-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowMessageForm(true)}
              className="w-full py-3 text-[12px] font-semibold tracking-[0.1em] uppercase text-navy border border-navy/15 hover:border-gold/30 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message Agent
            </button>
          )}

          {/* Phone/text */}
          <div className="flex gap-2 pt-2 border-t border-navy/10">
            <a href="tel:5125376023" className="flex-1 text-center py-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-navy/50 hover:text-navy transition-colors">
              Call
            </a>
            <a href={`sms:5125376023?body=Hi, I'm interested in ${address}, ${city}`} className="flex-1 text-center py-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-navy/50 hover:text-navy transition-colors">
              Text
            </a>
            <a href={`https://wa.me/15125376023?text=Hi, I'm interested in ${encodeURIComponent(address + ', ' + city)}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-navy/50 hover:text-navy transition-colors">
              WhatsApp
            </a>
          </div>
        </>
      ) : (
        /* Not logged in — show CTA to register */
        <>
          <h3 className="text-lg font-semibold text-navy">
            Interested in this property?
          </h3>
          <p className="text-sm text-mid-gray">
            Create a free account to request showings, save homes, message an agent, and access off-market listings.
          </p>
          <Link href={`/register?callbackUrl=/listings/${listingId}`} className="btn-primary w-full text-center">
            Create Free Account
          </Link>
          <Link href={`/login?callbackUrl=/listings/${listingId}`} className="w-full py-3 text-[12px] font-semibold tracking-[0.1em] uppercase text-navy border border-navy/15 hover:border-gold/30 transition-colors text-center block">
            Sign In
          </Link>
          <div className="flex gap-2 pt-2 border-t border-navy/10">
            <a href="tel:5125376023" className="flex-1 text-center py-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-navy/50 hover:text-navy">Call</a>
            <a href={`sms:5125376023?body=Hi, I'm interested in ${address}, ${city}`} className="flex-1 text-center py-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-navy/50 hover:text-navy">Text</a>
          </div>
        </>
      )}
    </div>
  );
}
