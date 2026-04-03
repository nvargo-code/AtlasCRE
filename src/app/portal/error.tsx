"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PortalError]", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-navy mb-2">Something went wrong</h2>
        <p className="text-mid-gray text-sm mb-6">
          This section encountered an error. Your data is safe.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-gold text-white px-5 py-2 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-gold-dark transition-colors"
          >
            Retry
          </button>
          <Link
            href="/portal"
            className="border border-navy/20 text-navy px-5 py-2 text-sm font-semibold tracking-[0.1em] uppercase hover:border-navy/40 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
