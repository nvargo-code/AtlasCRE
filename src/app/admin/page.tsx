"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

interface IngestionResult {
  providersRun: number;
  listingsFetched: number;
  listingsUpserted: number;
  variantsCreated: number;
  errors: string[];
}

const PROVIDERS = [
  { slug: "realtor", name: "Realtor.com" },
  { slug: "loopnet", name: "LoopNet" },
  { slug: "crexi", name: "Crexi" },
  { slug: "davisonvogel", name: "Davison & Vogel" },
  { slug: "youngerpartners", name: "Younger Partners" },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<IngestionResult[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  async function triggerIngestion(provider?: string) {
    setRunning(provider || "all");
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      setResults((prev) => [data, ...prev]);
    } catch (err) {
      setResults((prev) => [
        { providersRun: 0, listingsFetched: 0, listingsUpserted: 0, variantsCreated: 0, errors: [String(err)] },
        ...prev,
      ]);
    }
    setRunning(null);
  }

  if (status === "loading" || !session) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Admin</h1>

        {/* Ingestion Controls */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Data Ingestion
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => triggerIngestion()}
              disabled={running !== null}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {running === "all" ? "Running all providers..." : "Run All Providers"}
            </button>

            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => triggerIngestion(p.slug)}
                  disabled={running !== null}
                  className="py-2 px-3 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {running === p.slug ? "Running..." : p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Log */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Ingestion Log
            </h2>
            <div className="space-y-4">
              {results.map((r, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Providers</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{r.providersRun}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Fetched</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{r.listingsFetched}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Upserted</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{r.listingsUpserted}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Variants</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{r.variantsCreated}</p>
                    </div>
                  </div>
                  {r.errors.length > 0 && (
                    <div className="text-red-500 text-xs">
                      {r.errors.map((e, j) => (
                        <p key={j}>{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
