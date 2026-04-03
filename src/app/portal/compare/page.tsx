"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SavedListing {
  id: string;
  listing: {
    id: string;
    address: string;
    city: string;
    zip: string | null;
    priceAmount: number | null;
    beds: number | null;
    baths: number | null;
    buildingSf: number | null;
    lotSizeAcres: number | null;
    yearBuilt: number | null;
    propertyType: string;
    propSubType: string | null;
    listingType: string;
    imageUrl: string | null;
    status: string;
  };
}

function fmt(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export default function ComparePage() {
  const [saved, setSaved] = useState<SavedListing[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        const items = (data.favorites || data || []).map((f: { id: string; listing: SavedListing["listing"]; listingId?: string }) => ({
          id: f.id || f.listingId,
          listing: {
            ...f.listing,
            priceAmount: f.listing.priceAmount ? Number(f.listing.priceAmount) : null,
            buildingSf: f.listing.buildingSf ? Number(f.listing.buildingSf) : null,
            lotSizeAcres: f.listing.lotSizeAcres ? Number(f.listing.lotSizeAcres) : null,
          },
        }));
        setSaved(items);
        // Auto-select first 4
        setSelected(new Set(items.slice(0, 4).map((i: SavedListing) => i.listing.id)));
      }
      setLoading(false);
    }
    load();
  }, []);

  function toggleSelect(listingId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else if (next.size < 5) next.add(listingId);
      return next;
    });
  }

  const comparingListings = saved
    .filter((s) => selected.has(s.listing.id))
    .map((s) => s.listing);

  const rows: { label: string; key: string; format?: (v: unknown) => string }[] = [
    { label: "Price", key: "priceAmount", format: (v) => fmt(v as number) },
    { label: "Beds", key: "beds", format: (v) => v ? String(v) : "—" },
    { label: "Baths", key: "baths", format: (v) => v ? String(v) : "—" },
    { label: "Sqft", key: "buildingSf", format: (v) => v ? Number(v).toLocaleString() : "—" },
    { label: "$/Sqft", key: "_ppsf", format: (v) => v ? `$${v}` : "—" },
    { label: "Lot Size", key: "lotSizeAcres", format: (v) => v ? `${v} acres` : "—" },
    { label: "Year Built", key: "yearBuilt", format: (v) => v ? String(v) : "—" },
    { label: "Type", key: "propSubType", format: (v) => (v as string) || "—" },
    { label: "Status", key: "status", format: (v) => String(v) },
    { label: "City", key: "city" },
    { label: "ZIP", key: "zip", format: (v) => (v as string) || "—" },
  ];

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-light text-navy">
          Compare <span className="font-semibold">Homes</span>
        </h1>
        <p className="text-mid-gray text-sm mt-1">
          Select up to 5 saved homes to compare side-by-side.
        </p>
      </div>

      {saved.length === 0 ? (
        <div className="bg-white border border-navy/10 p-16 text-center">
          <h3 className="text-lg font-semibold text-navy mb-2">No Saved Homes</h3>
          <p className="text-mid-gray text-sm mb-4">Save homes from search to compare them here.</p>
          <Link href="/search" className="bg-gold text-white px-6 py-2.5 text-sm font-semibold">Search Homes</Link>
        </div>
      ) : (
        <>
          {/* Selection bar */}
          <div className="flex flex-wrap gap-2 mb-6">
            {saved.map((s) => {
              const isSelected = selected.has(s.listing.id);
              return (
                <button
                  key={s.listing.id}
                  onClick={() => toggleSelect(s.listing.id)}
                  className={`px-3 py-1.5 text-[11px] font-semibold tracking-wider transition-colors ${
                    isSelected
                      ? "bg-gold text-white"
                      : "bg-white border border-navy/10 text-navy/50 hover:text-navy"
                  }`}
                >
                  {s.listing.address.split(",")[0]}
                </button>
              );
            })}
          </div>

          {comparingListings.length >= 2 ? (
            <div className="bg-white border border-navy/10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-navy">
                    <th className="p-4 text-left text-[10px] font-semibold tracking-wider uppercase text-mid-gray w-28">Feature</th>
                    {comparingListings.map((l) => (
                      <th key={l.id} className="p-4 text-center min-w-[180px]">
                        <Link href={`/listings/${l.id}`} className="block hover:text-gold transition-colors">
                          {l.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={l.imageUrl} alt="" className="w-full h-24 object-cover mb-2" />
                          )}
                          <p className="text-xs font-semibold text-navy truncate">{l.address}</p>
                          <p className="text-[10px] text-mid-gray">{l.city}</p>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    // Find best value for highlighting
                    const values = comparingListings.map((l) => {
                      if (row.key === "_ppsf") {
                        return l.priceAmount && l.buildingSf
                          ? Math.round(l.priceAmount / l.buildingSf)
                          : null;
                      }
                      return (l as Record<string, unknown>)[row.key];
                    });

                    return (
                      <tr key={row.key} className="border-b border-navy/5">
                        <td className="p-3 text-[11px] font-semibold tracking-wider uppercase text-mid-gray">{row.label}</td>
                        {values.map((val, i) => {
                          const formatted = row.format ? row.format(val) : String(val ?? "—");
                          // Highlight lowest price or highest sqft
                          let highlight = false;
                          if (row.key === "priceAmount" && val != null) {
                            const numVals = values.filter((v): v is number => v != null) as number[];
                            highlight = (val as number) === Math.min(...numVals);
                          }
                          if (row.key === "buildingSf" && val != null) {
                            const numVals = values.filter((v): v is number => v != null) as number[];
                            highlight = (val as number) === Math.max(...numVals);
                          }

                          return (
                            <td key={i} className={`p-3 text-center ${highlight ? "text-gold font-bold" : "text-navy"}`}>
                              {formatted}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border border-navy/10 p-12 text-center">
              <p className="text-mid-gray text-sm">Select at least 2 homes to compare.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
