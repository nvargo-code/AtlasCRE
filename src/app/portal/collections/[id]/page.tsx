"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  shareToken: string;
  createdBy: { name: string | null; role: string };
  members: Array<{ user: { id: string; name: string | null; role: string } }>;
  listings: Array<{
    id: string;
    position: number;
    listing: {
      id: string; address: string; city: string; state: string; zip: string | null;
      priceAmount: number | null; beds: number | null; baths: number | null;
      buildingSf: number | null; yearBuilt: number | null; imageUrl: string | null;
      listingType: string; propSubType: string | null; propertyType: string;
      description: string | null;
      hotScore: { score: number; reasoning: string } | null;
    };
    addedBy: { name: string | null };
    reactions: Array<{ userId: string; user: { name: string | null }; reaction: string }>;
    comments: Array<{ id: string; userId: string; user: { name: string | null }; body: string; createdAt: string }>;
  }>;
}

const REACTIONS = [
  { type: "love", emoji: "\u2764\uFE0F", label: "Love it" },
  { type: "like", emoji: "\uD83D\uDC4D", label: "Like" },
  { type: "maybe", emoji: "\uD83E\uDD14", label: "Maybe" },
  { type: "dislike", emoji: "\uD83D\uDC4E", label: "Pass" },
];

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [view, setView] = useState<"grid" | "compare">("grid");
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    loadCollection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCollection() {
    const { id } = await params;
    setLoading(true);
    const res = await fetch(`/api/portal/collections/${id}`);
    if (res.ok) {
      const data = await res.json();
      setCollection(data.collection);
    }
    setLoading(false);
  }

  async function react(collectionListingId: string, type: string) {
    if (!collection) return;
    await fetch(`/api/portal/collections/${collection.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction: { collectionListingId, type } }),
    });
    loadCollection();
  }

  async function addComment(collectionListingId: string) {
    if (!collection || !commentText[collectionListingId]?.trim()) return;
    await fetch(`/api/portal/collections/${collection.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: { collectionListingId, body: commentText[collectionListingId] } }),
    });
    setCommentText({ ...commentText, [collectionListingId]: "" });
    loadCollection();
  }

  if (loading) return <div className="p-10 text-mid-gray text-center">Loading collection...</div>;
  if (!collection) return <div className="p-10 text-mid-gray text-center">Collection not found</div>;

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/portal/collections" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark mb-2 inline-block">
            &larr; Collections
          </Link>
          <h1 className="text-2xl font-light text-navy">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-mid-gray text-sm mt-1">{collection.description}</p>
          )}
          <p className="text-[11px] text-mid-gray mt-2">
            {collection.listings.length} homes &middot; Created by {collection.createdBy.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/search?searchMode=residential`}
            className="bg-gold text-white px-3 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase hover:bg-gold-dark transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Homes
          </Link>
          <button
            onClick={() => {
              const url = `${window.location.origin}/shared/${collection.shareToken}`;
              navigator.clipboard.writeText(url);
              setShareCopied(true);
              setTimeout(() => setShareCopied(false), 2000);
            }}
            className="bg-white border border-navy/10 px-3 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-navy hover:text-gold transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {shareCopied ? "Copied!" : "Share"}
          </button>
          <button
            onClick={() => window.print()}
            className="bg-white border border-navy/10 px-3 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-navy hover:text-gold transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={() => setView(view === "grid" ? "compare" : "grid")}
            className="bg-white border border-navy/10 px-3 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-navy hover:text-gold transition-colors"
          >
            {view === "grid" ? "Compare View" : "Grid View"}
          </button>
        </div>
      </div>

      {collection.listings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-navy/10">
          <p className="text-mid-gray mb-4">No homes in this collection yet.</p>
          <Link href="/search" className="bg-gold text-white px-6 py-2.5 text-sm font-semibold hover:bg-gold-dark inline-block">
            Search for Homes
          </Link>
        </div>
      ) : view === "compare" ? (
        /* Compare view — side by side table */
        <div className="bg-white border border-navy/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-semibold tracking-[0.12em] uppercase text-mid-gray bg-warm-gray min-w-[100px]">&nbsp;</th>
                {collection.listings.map((cl) => (
                  <th key={cl.id} className="text-left px-4 py-3 min-w-[200px] bg-warm-gray">
                    <Link href={`/listings/${cl.listing.id}`} className="text-navy font-semibold hover:text-gold text-sm">
                      {cl.listing.address}
                    </Link>
                    <p className="text-[11px] text-mid-gray font-normal">{cl.listing.city}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Price", render: (l: CollectionDetail["listings"][0]["listing"]) => l.priceAmount ? `$${l.priceAmount.toLocaleString()}` : "Contact" },
                { label: "Type", render: (l: CollectionDetail["listings"][0]["listing"]) => l.propSubType || l.propertyType },
                { label: "Beds", render: (l: CollectionDetail["listings"][0]["listing"]) => l.beds ?? "—" },
                { label: "Baths", render: (l: CollectionDetail["listings"][0]["listing"]) => l.baths ?? "—" },
                { label: "Sq Ft", render: (l: CollectionDetail["listings"][0]["listing"]) => l.buildingSf ? l.buildingSf.toLocaleString() : "—" },
                { label: "$/Sq Ft", render: (l: CollectionDetail["listings"][0]["listing"]) => l.priceAmount && l.buildingSf ? `$${Math.round(l.priceAmount / l.buildingSf)}` : "—" },
                { label: "Year Built", render: (l: CollectionDetail["listings"][0]["listing"]) => l.yearBuilt ?? "—" },
                { label: "Hot Score", render: (l: CollectionDetail["listings"][0]["listing"]) => l.hotScore ? `${l.hotScore.score}/100` : "—" },
              ].map((row) => (
                <tr key={row.label} className="border-t border-navy/5">
                  <td className="px-4 py-2.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-mid-gray">
                    {row.label}
                  </td>
                  {collection.listings.map((cl) => (
                    <td key={cl.id} className="px-4 py-2.5 text-navy font-medium">
                      {String(row.render(cl.listing))}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-navy/5">
                <td className="px-4 py-2.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-mid-gray">Reactions</td>
                {collection.listings.map((cl) => (
                  <td key={cl.id} className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {REACTIONS.map((r) => {
                        const myReaction = cl.reactions.find((re) => re.userId === userId);
                        const count = cl.reactions.filter((re) => re.reaction === r.type).length;
                        return (
                          <button
                            key={r.type}
                            onClick={() => react(cl.id, r.type)}
                            className={`text-lg px-1 py-0.5 rounded transition-colors ${
                              myReaction?.reaction === r.type ? "bg-gold/20" : "hover:bg-navy/5"
                            }`}
                            title={r.label}
                          >
                            {r.emoji}{count > 0 && <span className="text-[10px] text-mid-gray ml-0.5">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid view — cards with reactions and comments */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collection.listings.map((cl) => {
            const myReaction = cl.reactions.find((r) => r.userId === userId);
            return (
              <div key={cl.id} className="bg-white border border-navy/10 overflow-hidden">
                {/* Image */}
                <Link href={`/listings/${cl.listing.id}`}>
                  <div className="aspect-[4/3] bg-navy/5 relative overflow-hidden img-zoom">
                    {cl.listing.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cl.listing.imageUrl} alt={cl.listing.address} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-mid-gray text-sm">No Photo</span>
                      </div>
                    )}
                    {cl.listing.hotScore && (
                      <div className={`absolute top-3 right-3 px-2 py-1 text-[10px] font-bold text-white ${
                        cl.listing.hotScore.score >= 70 ? "bg-red-500" : cl.listing.hotScore.score >= 40 ? "bg-orange-500" : "bg-navy/60"
                      }`}>
                        {cl.listing.hotScore.score >= 70 ? "\uD83D\uDD25" : ""} {cl.listing.hotScore.score}
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-semibold tracking-[0.1em] uppercase px-2 py-0.5">
                      {cl.listing.listingType}
                    </span>
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/listings/${cl.listing.id}`}>
                    <p className="text-lg font-semibold text-navy hover:text-gold transition-colors">
                      {cl.listing.priceAmount ? `$${cl.listing.priceAmount.toLocaleString()}` : "Contact"}
                    </p>
                    <p className="text-sm text-navy/70 truncate">{cl.listing.address}</p>
                    <p className="text-[12px] text-mid-gray">{cl.listing.city}, {cl.listing.state}</p>
                  </Link>

                  <div className="flex items-center gap-3 mt-2 text-[12px] text-mid-gray">
                    {cl.listing.beds && <span>{cl.listing.beds} bd</span>}
                    {cl.listing.baths && <span>{cl.listing.baths} ba</span>}
                    {cl.listing.buildingSf && <span>{cl.listing.buildingSf.toLocaleString()} SF</span>}
                  </div>

                  {/* Hot Score reasoning */}
                  {cl.listing.hotScore && (
                    <p className="text-[11px] text-mid-gray mt-2 italic">
                      {cl.listing.hotScore.reasoning.slice(0, 100)}...
                    </p>
                  )}

                  {/* Reactions */}
                  <div className="flex gap-1 mt-3 pt-3 border-t border-navy/5">
                    {REACTIONS.map((r) => {
                      const count = cl.reactions.filter((re) => re.reaction === r.type).length;
                      return (
                        <button
                          key={r.type}
                          onClick={() => react(cl.id, r.type)}
                          className={`text-base px-2 py-1 rounded transition-colors ${
                            myReaction?.reaction === r.type ? "bg-gold/20 border border-gold/30" : "hover:bg-navy/5 border border-transparent"
                          }`}
                          title={r.label}
                        >
                          {r.emoji}{count > 0 && <span className="text-[10px] text-mid-gray ml-0.5">{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Comments */}
                  {cl.comments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {cl.comments.map((c) => (
                        <div key={c.id} className="text-[12px]">
                          <span className="font-semibold text-navy">{c.user.name}: </span>
                          <span className="text-mid-gray">{c.body}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment */}
                  <div className="mt-2 flex gap-1">
                    <input
                      value={commentText[cl.id] || ""}
                      onChange={(e) => setCommentText({ ...commentText, [cl.id]: e.target.value })}
                      placeholder="Add a note..."
                      className="flex-1 border border-navy/10 px-2.5 py-1.5 text-[12px] text-navy focus:outline-none focus:border-gold"
                      onKeyDown={(e) => e.key === "Enter" && addComment(cl.id)}
                    />
                    <button
                      onClick={() => addComment(cl.id)}
                      className="text-gold text-[11px] font-semibold px-2 hover:text-gold-dark"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
