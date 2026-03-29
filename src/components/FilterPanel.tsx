"use client";

import { ListingFilters, PropertyType, ListingType, Market, ResidentialPropertySubType, SearchMode } from "@/types";

interface FilterPanelProps {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
  open: boolean;
  onToggle: () => void;
}

const PROPERTY_TYPES: PropertyType[] = [
  "Office", "Retail", "Industrial", "Multifamily", "Land", "Mixed Use", "Hospitality", "Special Purpose",
];

const LISTING_TYPES: ListingType[] = ["Sale", "Lease", "Sublease"];

const RESIDENTIAL_SUBTYPES: ResidentialPropertySubType[] = [
  "Single Family", "Condo", "Townhouse", "Multi-Family", "Mobile/Manufactured", "Land", "Farm/Ranch",
];

export function FilterPanel({ filters, onChange, open, onToggle }: FilterPanelProps) {
  const isResidential = filters.searchMode === "residential";

  function update(partial: Partial<ListingFilters>) {
    onChange({ ...filters, ...partial });
  }

  function toggleArrayItem<T>(arr: T[] | undefined, item: T): T[] {
    if (!arr) return [item];
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }

  function switchMode(mode: SearchMode | undefined) {
    if (mode === "residential") {
      // Switching to residential — clear commercial-specific filters
      onChange({
        ...filters,
        searchMode: "residential",
        propertyType: undefined,
        listingType: undefined,
        sfMin: undefined,
        sfMax: undefined,
        brokerCompany: undefined,
      });
    } else {
      // Switching to commercial — clear residential-specific filters
      onChange({
        ...filters,
        searchMode: undefined,
        bedsMin: undefined,
        bedsMax: undefined,
        bathsMin: undefined,
        bathsMax: undefined,
        propSubType: undefined,
      });
    }
  }

  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        Filters
      </button>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Filters</h2>
        <button onClick={onToggle} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Mode Toggle */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Mode
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => switchMode(undefined)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                !isResidential
                  ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              Commercial
            </button>
            <button
              onClick={() => switchMode("residential")}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                isResidential
                  ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              Residential
            </button>
          </div>
        </div>

        {/* Market */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Market
          </label>
          <div className="flex gap-2">
            {(["austin", "dfw"] as Market[]).map((m) => (
              <button
                key={m}
                onClick={() => update({ market: filters.market === m ? undefined : m })}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  filters.market === m
                    ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {m === "austin" ? "Austin" : "DFW"}
              </button>
            ))}
          </div>
        </div>

        {/* Commercial: Property Type */}
        {!isResidential && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Property Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PROPERTY_TYPES.map((pt) => (
                <button
                  key={pt}
                  onClick={() => update({ propertyType: toggleArrayItem(filters.propertyType, pt) })}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    filters.propertyType?.includes(pt)
                      ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Residential: Property SubType */}
        {isResidential && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Property Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {RESIDENTIAL_SUBTYPES.map((pst) => (
                <button
                  key={pst}
                  onClick={() => update({ propSubType: toggleArrayItem(filters.propSubType, pst) })}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    filters.propSubType?.includes(pst)
                      ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {pst}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Commercial: Listing Type */}
        {!isResidential && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Listing Type
            </label>
            <div className="flex gap-2">
              {LISTING_TYPES.map((lt) => (
                <button
                  key={lt}
                  onClick={() => update({ listingType: toggleArrayItem(filters.listingType, lt) })}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    filters.listingType?.includes(lt)
                      ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {lt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Residential: Beds */}
        {isResidential && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Bedrooms
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                min={0}
                value={filters.bedsMin ?? ""}
                onChange={(e) => update({ bedsMin: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <input
                type="number"
                placeholder="Max"
                min={0}
                value={filters.bedsMax ?? ""}
                onChange={(e) => update({ bedsMax: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}

        {/* Residential: Baths */}
        {isResidential && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Bathrooms
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                min={0}
                step={0.5}
                value={filters.bathsMin ?? ""}
                onChange={(e) => update({ bathsMin: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <input
                type="number"
                placeholder="Max"
                min={0}
                step={0.5}
                value={filters.bathsMax ?? ""}
                onChange={(e) => update({ bathsMax: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}

        {/* Price Range (shared) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Price Range
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceMin ?? ""}
              onChange={(e) => update({ priceMin: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.priceMax ?? ""}
              onChange={(e) => update({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Commercial: Building SF Range */}
        {!isResidential && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Building SF
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min SF"
                value={filters.sfMin ?? ""}
                onChange={(e) => update({ sfMin: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <input
                type="number"
                placeholder="Max SF"
                value={filters.sfMax ?? ""}
                onChange={(e) => update({ sfMax: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}

        {/* Year Built Range (shared) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Year Built
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="From"
              value={filters.yearBuiltMin ?? ""}
              onChange={(e) => update({ yearBuiltMin: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <input
              type="number"
              placeholder="To"
              value={filters.yearBuiltMax ?? ""}
              onChange={(e) => update({ yearBuiltMax: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Commercial: Broker Company */}
        {!isResidential && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Broker Company
            </label>
            <input
              type="text"
              placeholder="e.g. CBRE, JLL..."
              value={filters.brokerCompany ?? ""}
              onChange={(e) => update({ brokerCompany: e.target.value || undefined })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}

        {/* Clear All */}
        <button
          onClick={() => onChange({})}
          className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}
