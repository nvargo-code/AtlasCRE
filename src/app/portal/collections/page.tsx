"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
  _count: { listings: number; members: number };
  listings: Array<{
    listing: { imageUrl: string | null; priceAmount: number | null; address: string };
  }>;
  createdBy: { name: string | null; role: string };
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadCollections(); }, []);

  async function loadCollections() {
    setLoading(true);
    const res = await fetch("/api/portal/collections");
    if (res.ok) {
      const data = await res.json();
      setCollections(data.collections || []);
    }
    setLoading(false);
  }

  async function createCollection() {
    if (!newName.trim()) return;
    setCreating(true);
    await fetch("/api/portal/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    setShowCreate(false);
    setCreating(false);
    loadCollections();
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-navy">
            My <span className="font-semibold">Collections</span>
          </h1>
          <p className="text-mid-gray text-sm mt-1">
            Organize homes into boards. Add notes, react, and compare.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-gold text-white px-4 py-2 text-[12px] font-semibold tracking-[0.1em] uppercase hover:bg-gold-dark transition-colors"
        >
          + New Collection
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="bg-white p-6 border border-navy/10 mb-6">
          <h3 className="text-base font-semibold text-navy mb-3">Create Collection</h3>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., 78704 Homes Under $800K"
            className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold mb-3"
            onKeyDown={(e) => e.key === "Enter" && createCollection()}
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={createCollection} disabled={creating} className="bg-gold text-white px-4 py-2 text-sm font-semibold hover:bg-gold-dark disabled:opacity-50">
              {creating ? "Creating..." : "Create"}
            </button>
            <button onClick={() => setShowCreate(false)} className="text-mid-gray text-sm px-4 py-2 hover:text-navy">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-mid-gray text-center py-16">Loading collections...</div>
      ) : collections.length === 0 ? (
        <div className="text-center py-16 bg-white border border-navy/10">
          <svg className="w-12 h-12 text-navy/10 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-semibold text-navy mb-2">No collections yet</h3>
          <p className="text-mid-gray text-sm mb-4">Create your first collection to start organizing homes.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-gold text-white px-6 py-2.5 text-sm font-semibold hover:bg-gold-dark"
          >
            Create Your First Collection
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/portal/collections/${col.id}`}
              className="bg-white border border-navy/10 hover:border-gold/30 hover:shadow-md transition-all group"
            >
              {/* Preview grid */}
              <div className="grid grid-cols-2 gap-0.5 aspect-[2/1] overflow-hidden">
                {[0, 1, 2, 3].map((i) => {
                  const img = col.listings[i]?.listing?.imageUrl;
                  return (
                    <div key={i} className="bg-navy/5">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-navy group-hover:text-gold transition-colors truncate">
                  {col.name}
                </h3>
                {col.description && (
                  <p className="text-mid-gray text-sm truncate mt-0.5">{col.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3 text-[11px] text-mid-gray">
                  <span>{col._count.listings} homes</span>
                  <span>{col._count.members} members</span>
                  <span>Updated {new Date(col.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
