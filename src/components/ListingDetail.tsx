"use client";

import { ListingWithVariants } from "@/types";
import { useState } from "react";

interface ListingDetailProps {
  listing: ListingWithVariants | null;
  onClose: () => void;
  onToggleFavorite: (listingId: string, isFavorited: boolean) => void;
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

export function ListingDetail({ listing, onClose, onToggleFavorite }: ListingDetailProps) {
  const [favLoading, setFavLoading] = useState(false);

  if (!listing) return null;

  async function handleFavorite() {
    if (!listing) return;
    setFavLoading(true);
    onToggleFavorite(listing.id, !!listing.isFavorited);
    setFavLoading(false);
  }

  return (
    <div className="w-96 bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 overflow-y-auto flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{listing.address}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {listing.city}, {listing.state} {listing.zip}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main info */}
      <div className="p-4 space-y-4">
        {listing.imageUrl && (
          <img src={listing.imageUrl} alt={listing.address} className="w-full h-48 object-cover rounded-lg" />
        )}

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-teal-600">
            {formatPrice(listing.priceAmount, listing.priceUnit)}
          </span>
          <button
            onClick={handleFavorite}
            disabled={favLoading}
            className={`p-2 rounded-lg transition-colors ${
              listing.isFavorited
                ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                : "text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <svg className="w-5 h-5" fill={listing.isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {listing.searchMode === "residential" ? (
            <>
              <InfoItem label="Type" value={listing.propSubType ?? listing.propertyType} />
              <InfoItem label="Listing Type" value={listing.listingType} />
              <InfoItem label="Beds" value={listing.beds?.toString() ?? "N/A"} />
              <InfoItem label="Baths" value={listing.baths?.toString() ?? "N/A"} />
              <InfoItem label="Garage" value={listing.garageSpaces?.toString() ?? "N/A"} />
              <InfoItem label="Stories" value={listing.stories?.toString() ?? "N/A"} />
              <InfoItem label="Lot Size" value={listing.lotSizeAcres ? `${listing.lotSizeAcres} ac` : "N/A"} />
              <InfoItem label="Year Built" value={listing.yearBuilt?.toString() ?? "N/A"} />
              <InfoItem label="Market" value={listing.market === "austin" ? "Austin" : "DFW"} />
              <InfoItem label="Broker" value={listing.brokerName ?? "N/A"} />
            </>
          ) : (
            <>
              <InfoItem label="Property Type" value={listing.propertyType} />
              <InfoItem label="Listing Type" value={listing.listingType} />
              <InfoItem label="Building SF" value={listing.buildingSf?.toLocaleString() ?? "N/A"} />
              <InfoItem label="Lot Size" value={listing.lotSizeAcres ? `${listing.lotSizeAcres} ac` : "N/A"} />
              <InfoItem label="Year Built" value={listing.yearBuilt?.toString() ?? "N/A"} />
              <InfoItem label="Market" value={listing.market === "austin" ? "Austin" : "DFW"} />
              <InfoItem label="Broker" value={listing.brokerName ?? "N/A"} />
              <InfoItem label="Company" value={listing.brokerCompany ?? "N/A"} />
            </>
          )}
        </div>

        {listing.description && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Description
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {listing.description}
            </p>
          </div>
        )}

        {/* IDX Compliance: Listing Broker Attribution */}
        {(listing.brokerName || listing.brokerCompany) && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Listing Broker
            </h3>
            {listing.brokerName && (
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{listing.brokerName}</p>
            )}
            {listing.brokerCompany && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{listing.brokerCompany}</p>
            )}
            {listing.variants[0]?.brokerPhone && (
              <p className="text-sm text-teal-600">{listing.variants[0].brokerPhone}</p>
            )}
            {listing.variants[0]?.brokerEmail && (
              <p className="text-sm text-teal-600">{listing.variants[0].brokerEmail}</p>
            )}
          </div>
        )}

        {/* Variants / Sources */}
        {listing.variants.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Sources ({listing.variants.length})
            </h3>
            <div className="space-y-2">
              {listing.variants.map((v) => (
                <div
                  key={v.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {v.sourceName}
                    </span>
                    {v.sourceUrl && (
                      <a
                        href={v.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-600 hover:underline"
                      >
                        View Source
                      </a>
                    )}
                  </div>
                  {v.priceAmount && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatPrice(v.priceAmount, v.priceUnit)}
                    </p>
                  )}
                  {v.brokerName && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {v.brokerName} {v.brokerPhone ? `| ${v.brokerPhone}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IDX Compliance: Data Disclaimer */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
            Listing data provided by Unlock MLS via MLS Grid. Information is deemed
            reliable but is not guaranteed accurate by the MLS or Vivid Acres LLC.
            Buyer to verify all information. Data last updated every 2 hours.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
