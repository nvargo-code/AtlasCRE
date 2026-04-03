"use client";

import { useState, useEffect } from "react";

interface ListingOption {
  id: string;
  address: string;
  city: string;
  priceAmount: number | null;
  imageUrl: string | null;
}

interface MarketingContent {
  instagram: string;
  email: { subject: string; body: string };
  flyer: string;
  justSold: string;
  openHouse: string;
}

type ContentTab = "instagram" | "email" | "flyer" | "justSold" | "openHouse" | "aiEnhanced";

const TAB_CONFIG: { key: ContentTab; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "email", label: "Email Blast" },
  { key: "openHouse", label: "Open House" },
  { key: "justSold", label: "Just Sold" },
  { key: "flyer", label: "Flyer Text" },
  { key: "aiEnhanced", label: "AI Enhanced" },
];

export default function MarketingPage() {
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [content, setContent] = useState<MarketingContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>("instagram");
  const [copied, setCopied] = useState(false);
  const [aiContent, setAiContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiType, setAiType] = useState("social_post");

  // Load recent listings for the picker
  useEffect(() => {
    async function loadListings() {
      const res = await fetch("/api/listings?limit=20&searchMode=residential");
      if (res.ok) {
        const data = await res.json();
        setListings(
          (data.listings || []).map((l: ListingOption & { priceAmount: number }) => ({
            id: l.id,
            address: l.address,
            city: l.city,
            priceAmount: l.priceAmount ? Number(l.priceAmount) : null,
            imageUrl: l.imageUrl,
          }))
        );
      }
    }
    loadListings();
  }, []);

  async function generateContent() {
    if (!selectedId) return;
    setLoading(true);
    setContent(null);
    setAiContent("");

    const res = await fetch(`/api/portal/marketing?listingId=${selectedId}`);
    if (res.ok) {
      const data = await res.json();
      setContent(data.content);
    }
    setLoading(false);
  }

  async function generateAI() {
    if (!selectedId) return;
    setAiLoading(true);
    setAiContent("");

    const res = await fetch("/api/portal/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: selectedId, contentType: aiType }),
    });
    if (res.ok) {
      const data = await res.json();
      setAiContent(data.content || "");
    }
    setAiLoading(false);
  }

  function getCurrentContent(): string {
    if (!content) return "";
    switch (activeTab) {
      case "instagram": return content.instagram;
      case "email": return `Subject: ${content.email.subject}\n\n${content.email.body}`;
      case "flyer": return content.flyer;
      case "justSold": return content.justSold;
      case "openHouse": return content.openHouse;
      case "aiEnhanced": return aiContent;
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedListing = listings.find((l) => l.id === selectedId);

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Agent Tools</p>
        <h1 className="text-2xl md:text-3xl font-light text-navy">
          Listing <span className="font-semibold">Marketing</span>
        </h1>
        <p className="text-mid-gray text-sm mt-2">
          Auto-generated marketing content for your listings. Copy, customize, and post.
        </p>
      </div>

      {/* Listing Picker */}
      <div className="bg-white border border-navy/10 p-6 mb-8">
        <h2 className="text-sm font-semibold text-navy mb-3 tracking-wide uppercase">Select Listing</h2>
        <div className="flex gap-4">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 border border-navy/15 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gold"
          >
            <option value="">Choose a listing...</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.address}, {l.city} — {l.priceAmount ? `$${l.priceAmount.toLocaleString()}` : "Price N/A"}
              </option>
            ))}
          </select>
          <button
            onClick={generateContent}
            disabled={!selectedId || loading}
            className="bg-navy text-white px-6 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {selectedListing?.imageUrl && (
          <div className="mt-4 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedListing.imageUrl} alt="" className="w-20 h-14 object-cover" />
            <div>
              <p className="text-sm font-semibold text-navy">{selectedListing.address}</p>
              <p className="text-[11px] text-mid-gray">{selectedListing.city} — {selectedListing.priceAmount ? `$${selectedListing.priceAmount.toLocaleString()}` : ""}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Tabs + Output */}
      {content && (
        <>
          <div className="flex flex-wrap gap-1 mb-4">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                  activeTab === tab.key
                    ? "bg-navy text-white"
                    : "bg-white border border-navy/10 text-navy/50 hover:text-navy"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-navy/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-navy tracking-wide uppercase">
                {TAB_CONFIG.find((t) => t.key === activeTab)?.label}
              </h3>
              {getCurrentContent() && (
                <button
                  onClick={copyToClipboard}
                  className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            {activeTab === "aiEnhanced" ? (
              <div>
                <div className="flex gap-2 mb-4">
                  <select
                    value={aiType}
                    onChange={(e) => setAiType(e.target.value)}
                    className="border border-navy/15 px-3 py-2 text-sm bg-white focus:outline-none focus:border-gold"
                  >
                    <option value="social_post">Social Media Post</option>
                    <option value="listing_description">MLS Description</option>
                    <option value="email_campaign">Email Campaign</option>
                  </select>
                  <button
                    onClick={generateAI}
                    disabled={aiLoading}
                    className="bg-gold text-white px-5 py-2 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-gold-dark disabled:opacity-50"
                  >
                    {aiLoading ? "Writing..." : "Generate with AI"}
                  </button>
                </div>
                {aiLoading ? (
                  <div className="flex items-center gap-2 py-8 justify-center text-mid-gray text-sm">
                    <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    Atlas AI is writing...
                  </div>
                ) : aiContent ? (
                  <div className="bg-warm-gray p-5 text-sm text-navy leading-relaxed whitespace-pre-wrap font-mono">
                    {aiContent}
                  </div>
                ) : (
                  <p className="text-mid-gray text-sm text-center py-8">
                    Select a content type and click Generate to create AI-enhanced marketing copy.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-warm-gray p-5 text-sm text-navy leading-relaxed whitespace-pre-wrap font-mono">
                {getCurrentContent()}
              </div>
            )}

            {activeTab !== "aiEnhanced" && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-gold hover:bg-gold-dark px-4 py-2"
                >
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!content && !loading && (
        <div className="bg-white border border-navy/10 p-16 text-center">
          <svg className="w-12 h-12 text-navy/15 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h3 className="text-lg font-semibold text-navy mb-2">Listing Marketing Center</h3>
          <p className="text-mid-gray text-sm max-w-md mx-auto">
            Select a listing above to auto-generate Instagram posts, email blasts, open house announcements, just sold posts, and flyer text — ready to copy and post.
          </p>
        </div>
      )}
    </div>
  );
}
