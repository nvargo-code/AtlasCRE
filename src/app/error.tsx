"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gray">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-navy/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-navy mb-3">Something went wrong</h1>
        <p className="text-mid-gray text-sm mb-8">
          We hit an unexpected error. This has been logged and our team will look into it.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-navy text-white px-6 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="border border-navy/20 text-navy px-6 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:border-navy/40 transition-colors"
          >
            Go Home
          </a>
        </div>
        {error.digest && (
          <p className="text-[10px] text-navy/20 mt-6">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
