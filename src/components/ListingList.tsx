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
              {l.propertyType}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {l.listingType}
            </span>
            {l.buildingSf && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {l.buildingSf.toLocaleString()} SF
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
