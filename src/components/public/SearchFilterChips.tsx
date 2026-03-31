"use client";

import { ListingFilters } from "@/types";

interface SearchFilterChipsProps {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
}

function formatPrice(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

export function SearchFilterChips({ filters, onChange }: SearchFilterChipsProps) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.query) {
    chips.push({
      label: `"${filters.query}"`,
      onRemove: () => onChange({ ...filters, query: undefined }),
    });
  }

  if (filters.market) {
    chips.push({
      label: filters.market === "austin" ? "Austin" : "DFW",
      onRemove: () => onChange({ ...filters, market: undefined }),
    });
  }

  if (filters.priceMin || filters.priceMax) {
    const min = filters.priceMin ? formatPrice(filters.priceMin) : "Any";
    const max = filters.priceMax ? formatPrice(filters.priceMax) : "Any";
    chips.push({
      label: `${min} — ${max}`,
      onRemove: () => onChange({ ...filters, priceMin: undefined, priceMax: undefined }),
    });
  }

  if (filters.bedsMin) {
    chips.push({
      label: `${filters.bedsMin}+ beds`,
      onRemove: () => onChange({ ...filters, bedsMin: undefined }),
    });
  }

  if (filters.bathsMin) {
    chips.push({
      label: `${filters.bathsMin}+ baths`,
      onRemove: () => onChange({ ...filters, bathsMin: undefined }),
    });
  }

  if (filters.sfMin) {
    chips.push({
      label: `${filters.sfMin.toLocaleString()}+ SF`,
      onRemove: () => onChange({ ...filters, sfMin: undefined }),
    });
  }

  if (filters.propertyType?.length) {
    filters.propertyType.forEach((pt) => {
      chips.push({
        label: pt,
        onRemove: () => onChange({
          ...filters,
          propertyType: filters.propertyType?.filter((t) => t !== pt),
        }),
      });
    });
  }

  if (filters.listingType?.length) {
    filters.listingType.forEach((lt) => {
      chips.push({
        label: `For ${lt}`,
        onRemove: () => onChange({
          ...filters,
          listingType: filters.listingType?.filter((t) => t !== lt),
        }),
      });
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="bg-white border-b border-navy/10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-mid-gray flex-shrink-0">
            Filters
          </span>
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1.5 bg-navy/5 text-navy text-[11px] font-medium px-2.5 py-1 flex-shrink-0"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="text-navy/30 hover:text-red-500 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <button
            onClick={() => onChange({ searchMode: filters.searchMode })}
            className="text-[10px] font-semibold tracking-[0.1em] uppercase text-mid-gray hover:text-red-500 transition-colors flex-shrink-0 ml-2"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
