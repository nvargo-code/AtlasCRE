"use client";

/**
 * IDX Compliance Disclaimer
 *
 * Required by NAR IDX Policy (Statement 7.58) and Unlock MLS rules.
 * Must appear on all pages displaying MLS listing data.
 */
export function IdxDisclaimer() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
          Listing information provided by Unlock MLS (formerly ACTRIS) via MLS
          Grid. Information is deemed reliable but is not guaranteed accurate by
          the MLS or Vivid Acres LLC. All data is for consumers&apos; personal,
          non-commercial use and may not be used for any purpose other than to
          identify prospective properties. Data is refreshed every 2 hours.
          Listing broker has attempted to offer accurate data, but buyers are
          advised to confirm all data with the listing broker. &copy;{" "}
          {new Date().getFullYear()} Unlock MLS. All rights reserved.
        </p>
      </div>
    </div>
  );
}

/**
 * Compact inline disclaimer for use in listing cards, map popups, etc.
 */
export function IdxDisclaimerInline() {
  return (
    <p className="text-[10px] text-gray-400 dark:text-gray-500">
      Data by Unlock MLS via MLS Grid. Deemed reliable but not guaranteed.
    </p>
  );
}
