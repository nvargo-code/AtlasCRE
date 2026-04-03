"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { Header } from "@/components/Header";

interface ListingSource {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  lastRunAt: string | null;
  lastRunStatus: string | null;
}

interface IngestionResult {
  providersRun: number;
  listingsFetched: number;
  listingsUpserted: number;
  variantsCreated: number;
  errors: string[];
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        never run
      </span>
    );
  }
  const isError = status.startsWith("error");
  return (
    <span
      className={`px-2 py-0.5 text-xs rounded-full ${
        isError
          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
      }`}
    >
      {isError ? "error" : "success"}
    </span>
  );
}

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        enabled ? "bg-teal-600" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sources, setSources] = useState<ListingSource[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState("");
  const [results, setResults] = useState<IngestionResult[]>([]);
  const [alnTwoFaPending, setAlnTwoFaPending] = useState(false);
  const [alnTwoFaCode, setAlnTwoFaCode] = useState("");
  const [alnJobId, setAlnJobId] = useState<string | null>(null);
  const twoFaPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alnJobPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  const loadSources = useCallback(async () => {
    const res = await fetch("/api/sources");
    if (res.ok) setSources(await res.json());
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadSources();
  }, [status, loadSources]);

  async function toggleSource(slug: string, enabled: boolean) {
    setToggling(slug);
    await fetch(`/api/sources/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    await loadSources();
    setToggling(null);
  }

  // Poll for ALN 2FA when ALN is running
  useEffect(() => {
    if (running === "aln" || running === "all" || alnJobId) {
      twoFaPollRef.current = setInterval(async () => {
        const res = await fetch("/api/aln/2fa").catch(() => null);
        if (res?.ok) {
          const data = await res.json();
          setAlnTwoFaPending(data.pending ?? false);
        }
      }, 2000);
    } else {
      if (twoFaPollRef.current) clearInterval(twoFaPollRef.current);
      setAlnTwoFaPending(false);
      setAlnTwoFaCode("");
    }
    return () => { if (twoFaPollRef.current) clearInterval(twoFaPollRef.current); };
  }, [running, alnJobId]);

  // Poll ALN async job status until complete or error
  useEffect(() => {
    if (!alnJobId) {
      if (alnJobPollRef.current) clearInterval(alnJobPollRef.current);
      return;
    }

    alnJobPollRef.current = setInterval(async () => {
      const res = await fetch(`/api/aln/job/${alnJobId}`).catch(() => null);
      if (!res?.ok) return;
      const data = await res.json();

      if (data.status === "complete") {
        if (alnJobPollRef.current) clearInterval(alnJobPollRef.current);
        // Fetch and upsert results
        const finishRes = await fetch("/api/aln/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: alnJobId }),
        }).catch(() => null);
        setAlnJobId(null);
        setRunning(null);
        if (finishRes?.ok) {
          const result = await finishRes.json();
          setResults(prev => [result, ...prev]);
        }
        await loadSources();
      } else if (data.status === "error") {
        if (alnJobPollRef.current) clearInterval(alnJobPollRef.current);
        setAlnJobId(null);
        setRunning(null);
        setResults(prev => [{
          providersRun: 1,
          listingsFetched: 0,
          listingsUpserted: 0,
          variantsCreated: 0,
          errors: [data.error ?? "ALN scrape failed"],
        }, ...prev]);
        await loadSources();
      }
    }, 5000);

    return () => { if (alnJobPollRef.current) clearInterval(alnJobPollRef.current); };
  }, [alnJobId, loadSources]);

  async function submitTwoFaCode() {
    if (!alnTwoFaCode.trim()) return;
    await fetch("/api/aln/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: alnTwoFaCode.trim() }),
    });
    setAlnTwoFaCode("");
    setAlnTwoFaPending(false);
  }

  async function clearAllListings() {
    if (!confirm("Delete ALL listings and variants from the database?")) return;
    setClearing(true);
    const res = await fetch("/api/admin/listings", { method: "DELETE" });
    const data = await res.json();
    setClearResult(`Deleted ${data.deletedListings} listings and ${data.deletedVariants} variants.`);
    setClearing(false);
  }

  async function triggerIngestion(provider?: string) {
    // ALN uses async job flow to avoid Vercel timeout
    if (provider === "aln") {
      setRunning("aln");
      const res = await fetch("/api/aln/start", { method: "POST" }).catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        setAlnJobId(data.jobId);
      } else {
        setRunning(null);
      }
      return;
    }

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
    await loadSources();
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

        {/* Source Cards */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Sources</h2>
            <div className="flex gap-2">
              <button
                onClick={clearAllListings}
                disabled={clearing || running !== null || alnJobId !== null}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {clearing ? "Clearing..." : "Clear All Listings"}
              </button>
              {clearResult && (
                <span className="text-sm text-green-600 ml-2">{clearResult}</span>
              )}
              <button
                onClick={() => triggerIngestion()}
                disabled={running !== null || alnJobId !== null}
                className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {running === "all" ? "Running all..." : "Run All Enabled"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {sources.map((source) => (
              <div
                key={source.slug}
                className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-lg"
              >
                {/* Toggle */}
                <Toggle
                  enabled={source.enabled}
                  onChange={(val) => toggleSource(source.slug, val)}
                  disabled={toggling === source.slug || running !== null || alnJobId !== null}
                />

                {/* Name + slug */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {source.name}
                    </span>
                    <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-mono">
                      {source.slug}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={source.lastRunStatus} />
                    {source.lastRunAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(source.lastRunAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Run button */}
                <button
                  onClick={() => triggerIngestion(source.slug)}
                  disabled={!source.enabled || running !== null || alnJobId !== null}
                  className="py-1.5 px-3 text-xs border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {running === source.slug || (source.slug === "aln" && alnJobId !== null) ? "Running..." : "Run"}
                </button>
              </div>
            ))}

            {/* ALN 2FA prompt */}
            {alnTwoFaPending && (
              <div className="flex items-center gap-3 p-4 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                    ALN 2FA required — enter the SMS code you received
                  </p>
                  <input
                    type="text"
                    value={alnTwoFaCode}
                    onChange={(e) => setAlnTwoFaCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitTwoFaCode()}
                    placeholder="6-digit code"
                    className="w-40 px-3 py-1.5 text-sm border border-amber-300 dark:border-amber-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    autoFocus
                  />
                </div>
                <button
                  onClick={submitTwoFaCode}
                  className="py-1.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Submit
                </button>
              </div>
            )}

            {sources.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Loading sources...</p>
            )}
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
