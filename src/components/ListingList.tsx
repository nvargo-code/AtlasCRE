"use client";

interface ListingItem {
  id: string;
  address: string;
  city: string;
  propertyType: string;
  listingType: string;
  priceAmount: number | null;
  priceUnit: string | null;
  buildingSf: number | null;
  status: string;
  beds?: number | null;
  baths?: number | null;
  propSubType?: string | null;
  searchMode?: string;
  brokerName?: string | null;
  brokerCompany?: string | null;
  sourceSlug?: string | null;
}

interface ListingListProps {
  listings: ListingItem[];
  onSelect: (id: string) => void;
  selectedId?: string;
}

function formatPrice(amount: number | null, unit: string | null): string {
  if (!amount) return "Price N/A";
  const formatted = `$${amount.toLocaleString()}`;
  switch (unit) {
    case "per_sf": return `${formatted}/SF`;
    case "per_sf_yr": return `${formatted}/SF/yr`;
    case "per_sf_mo": return `${formatted}/SF/mo`;
    default: return formatted;
  }
}

export function ListingList({ listings, onSelect, selectedId }: ListingListProps) {
  if (listings.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        No listings found. Adjust your filters or zoom out.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {listings.map((l) => (
        <button
          key={l.id}
          onClick={() => onSelect(l.id)}
          className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
            selectedId === l.id ? "bg-teal-50 dark:bg-teal-900/20" : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{l.address}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{l.city}</p>
            </div>
            <span className="text-sm font-semibold text-teal-600">
              {formatPrice(l.priceAmount, l.priceUnit)}
            </span>
          </div>
          <div className="flex gap-2 mt-1.5">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {l.searchMode === "residential" ? (l.propSubType ?? l.propertyType) : l.propertyType}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {l.listingType}
            </span>
            {l.searchMode === "residential" ? (
              <>
                {l.beds != null && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{l.beds} bd</span>
                )}
                {l.baths != null && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{l.baths} ba</span>
                )}
              </>
            ) : (
              l.buildingSf && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {l.buildingSf.toLocaleString()} SF
                </span>
              )
            )}
          </div>
          {/* IDX Compliance: Listing broker attribution */}
          <div className="flex items-center gap-2 mt-1.5">
            {l.brokerCompany && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                Listed by {l.brokerCompany}
              </span>
            )}
            {l.sourceSlug && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                l.sourceSlug === "mlsgrid"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : l.sourceSlug === "aln"
                  ? "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                  : "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}>
                {l.sourceSlug === "mlsgrid" ? "MLS" : l.sourceSlug === "aln" ? "ALN" : l.sourceSlug === "realtor" ? "Realtor" : l.sourceSlug?.toUpperCase()}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
