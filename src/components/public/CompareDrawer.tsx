"use client";

import Link from "next/link";

interface CompareListing {
  id: string;
  address: string;
  city: string;
  priceAmount: number | null;
  priceUnit: string | null;
  beds: number | null;
  baths: number | null;
  buildingSf: number | null;
  propertyType: string;
  propSubType: string | null;
  yearBuilt?: number | null;
  imageUrl?: string | null;
}

interface CompareDrawerProps {
  listings: CompareListing[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

function formatPrice(amount: number | null): string {
  if (!amount) return "N/A";
  return amount >= 1000000
    ? `$${(amount / 1000000).toFixed(1)}M`
    : `$${amount.toLocaleString()}`;
}

export function CompareDrawer({ listings, onRemove, onClear }: CompareDrawerProps) {
  if (listings.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-navy/10 shadow-2xl">
      {/* Collapsed bar */}
      {listings.length < 2 && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-semibold tracking-[0.1em] uppercase text-gold">
              Compare
            </span>
            <span className="text-sm text-mid-gray">
              {listings.length}/3 selected — add {2 - listings.length} more to compare
            </span>
          </div>
          <div className="flex items-center gap-3">
            {listings.map((l) => (
              <div key={l.id} className="flex items-center gap-2 bg-warm-gray px-3 py-1.5">
                <span className="text-[12px] text-navy truncate max-w-[120px]">
                  {l.address}
                </span>
                <button
                  onClick={() => onRemove(l.id)}
                  className="text-mid-gray hover:text-red-500"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison table (2+ listings) */}
      {listings.length >= 2 && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-navy">
              Compare Properties ({listings.length})
            </h3>
            <button
              onClick={onClear}
              className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray hover:text-red-500 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray pb-3 pr-6 min-w-[100px]">
                    &nbsp;
                  </th>
                  {listings.map((l) => (
                    <th key={l.id} className="text-left pb-3 pr-6 min-w-[180px]">
                      <div className="flex items-start justify-between">
                        <Link href={`/listings/${l.id}`} className="text-navy font-semibold hover:text-gold transition-colors text-sm">
                          {l.address}
                        </Link>
                        <button
                          onClick={() => onRemove(l.id)}
                          className="text-mid-gray hover:text-red-500 ml-2 flex-shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-[11px] text-mid-gray font-normal">{l.city}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Price", render: (l: CompareListing) => formatPrice(l.priceAmount) },
                  { label: "Type", render: (l: CompareListing) => l.propSubType || l.propertyType },
                  { label: "Beds", render: (l: CompareListing) => l.beds ?? "—" },
                  { label: "Baths", render: (l: CompareListing) => l.baths ?? "—" },
                  { label: "Sq Ft", render: (l: CompareListing) => l.buildingSf?.toLocaleString() ?? "—" },
                  {
                    label: "$/Sq Ft",
                    render: (l: CompareListing) =>
                      l.priceAmount && l.buildingSf
                        ? `$${Math.round(l.priceAmount / l.buildingSf)}`
                        : "—",
                  },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-navy/5">
                    <td className="py-2.5 pr-6 text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray">
                      {row.label}
                    </td>
                    {listings.map((l) => (
                      <td key={l.id} className="py-2.5 pr-6 text-navy font-medium">
                        {row.render(l)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
