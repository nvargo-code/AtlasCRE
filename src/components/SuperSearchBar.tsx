"use client";

interface SuperSearchBarProps {
  superSearchCount: number;
  zillowCount: number | null;
  loading?: boolean;
}

export function SuperSearchBar({ superSearchCount, zillowCount, loading }: SuperSearchBarProps) {
  const hasAdvantage = zillowCount !== null && superSearchCount > zillowCount;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 border-b border-teal-200 dark:border-teal-800">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
          SuperSearch
        </span>
        <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
          {superSearchCount.toLocaleString()} listings
        </span>
      </div>

      <span className="text-gray-300 dark:text-gray-600">|</span>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Zillow
        </span>
        {loading ? (
          <span className="text-xs text-gray-400 animate-pulse">checking...</span>
        ) : zillowCount !== null ? (
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {zillowCount.toLocaleString()} listings
          </span>
        ) : (
          <span className="text-xs text-gray-400">N/A</span>
        )}
      </div>

      {hasAdvantage && (
        <span className="ml-auto text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 rounded-full">
          +{(superSearchCount - (zillowCount ?? 0)).toLocaleString()} more
        </span>
      )}
    </div>
  );
}
