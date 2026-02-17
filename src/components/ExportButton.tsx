"use client";

import { useState } from "react";
import { ListingFilters } from "@/types";

interface ExportButtonProps {
  filters: ListingFilters;
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  function buildExportUrl(format: string): string {
    const params = new URLSearchParams();
    params.set("format", format);
    if (filters.market) params.set("market", filters.market);
    if (filters.propertyType?.length) params.set("propertyType", filters.propertyType.join(","));
    if (filters.listingType?.length) params.set("listingType", filters.listingType.join(","));
    if (filters.priceMin) params.set("priceMin", filters.priceMin.toString());
    if (filters.priceMax) params.set("priceMax", filters.priceMax.toString());
    if (filters.sfMin) params.set("sfMin", filters.sfMin.toString());
    if (filters.sfMax) params.set("sfMax", filters.sfMax.toString());
    if (filters.status) params.set("status", filters.status);
    if (filters.brokerCompany) params.set("brokerCompany", filters.brokerCompany);
    if (filters.query) params.set("q", filters.query);
    return `/api/export?${params.toString()}`;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px] z-20">
          {[
            { format: "xlsx", label: "Excel (.xlsx)" },
            { format: "csv", label: "CSV (.csv)" },
            { format: "pdf", label: "PDF (.pdf)" },
          ].map(({ format, label }) => (
            <a
              key={format}
              href={buildExportUrl(format)}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
