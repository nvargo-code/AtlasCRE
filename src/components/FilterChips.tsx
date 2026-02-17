"use client";

import { ListingFilters } from "@/types";

interface FilterChipsProps {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
}

export function FilterChips({ filters, onChange }: FilterChipsProps) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.market) {
    chips.push({
      label: filters.market === "austin" ? "Austin" : "DFW",
      onRemove: () => onChange({ ...filters, market: undefined }),
    });
  }

  filters.propertyType?.forEach((pt) => {
    chips.push({
      label: pt,
      onRemove: () =>
        onChange({
          ...filters,
          propertyType: filters.propertyType?.filter((t) => t !== pt),
        }),
    });
  });

  filters.listingType?.forEach((lt) => {
    chips.push({
      label: lt,
      onRemove: () =>
        onChange({
          ...filters,
          listingType: filters.listingType?.filter((t) => t !== lt),
        }),
    });
  });

  if (filters.priceMin || filters.priceMax) {
    const min = filters.priceMin ? `$${filters.priceMin.toLocaleString()}` : "";
    const max = filters.priceMax ? `$${filters.priceMax.toLocaleString()}` : "";
    chips.push({
      label: `Price: ${min}${min && max ? " - " : ""}${max}`,
      onRemove: () => onChange({ ...filters, priceMin: undefined, priceMax: undefined }),
    });
  }

  if (filters.sfMin || filters.sfMax) {
    chips.push({
      label: `SF: ${filters.sfMin ?? ""}${filters.sfMin && filters.sfMax ? " - " : ""}${filters.sfMax ?? ""}`,
      onRemove: () => onChange({ ...filters, sfMin: undefined, sfMax: undefined }),
    });
  }

  if (filters.brokerCompany) {
    chips.push({
      label: `Broker: ${filters.brokerCompany}`,
      onRemove: () => onChange({ ...filters, brokerCompany: undefined }),
    });
  }

  if (filters.query) {
    chips.push({
      label: `"${filters.query}"`,
      onRemove: () => onChange({ ...filters, query: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      {chips.map((chip, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
        >
          {chip.label}
          <button onClick={chip.onRemove} className="hover:text-red-500 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}
