"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface ProcessedEmailRow {
  id: string;
  gmailMessageId: string;
  from: string;
  subject: string;
  receivedAt: string;
  processedAt: string;
  isPocketListing: boolean;
  confidence: number;
  keywords: string[];
  mlsNumber: string | null;
  status: string;
  listingId: string | null;
  errorMessage: string | null;
}

export default function EmailScanAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<ProcessedEmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Record<string, unknown> | null>(null);
  const [filter, setFilter] = useState<"all" | "pocket" | "ingested" | "skipped">("all");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchEmails();
  }, [status]);

  async function fetchEmails() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-scan");
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch {
      // Handle error
    }
    setLoading(false);
  }

  async function triggerScan() {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/ingest/email-scan", { method: "POST" });
      const data = await res.json();
      setScanResult(data);
      fetchEmails(); // Refresh the list
    } catch (e) {
      setScanResult({ error: String(e) });
    }
    setScanning(false);
  }

  const filtered = emails.filter((e) => {
    if (filter === "pocket") return e.isPocketListing;
    if (filter === "ingested") return e.status === "ingested";
    if (filter === "skipped") return e.status === "skipped";
    return true;
  });

  const stats = {
    total: emails.length,
    pocket: emails.filter((e) => e.isPocketListing).length,
    ingested: emails.filter((e) => e.status === "ingested").length,
    skipped: emails.filter((e) => e.status === "skipped").length,
    errors: emails.filter((e) => e.status === "error").length,
  };

  if (status === "loading" || !session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-teal-600 font-bold text-lg">AtlasCRE</Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <h1 className="text-gray-900 dark:text-gray-100 font-semibold">Email Scanner</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin-email"
              className="text-sm text-gray-500 hover:text-teal-600 transition-colors"
            >
              Manual Entry
            </Link>
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {scanning ? "Scanning..." : "Run Scan Now"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Scan result banner */}
        {scanResult && (
          <div className={`mb-6 p-4 rounded-lg ${scanResult.error ? "bg-red-50 dark:bg-red-900/20 text-red-700" : "bg-teal-50 dark:bg-teal-900/20 text-teal-700"}`}>
            {scanResult.error ? (
              <p>Scan failed: {String(scanResult.error)}</p>
            ) : (
              <p>
                Scan complete: {String(scanResult.messagesScanned)} emails scanned,{" "}
                {String(scanResult.pocketListingsFound)} pocket listings found,{" "}
                {String(scanResult.listingsIngested)} ingested.
              </p>
            )}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Processed", value: stats.total, color: "text-gray-900 dark:text-gray-100" },
            { label: "Pocket Listings", value: stats.pocket, color: "text-teal-600" },
            { label: "Ingested", value: stats.ingested, color: "text-green-600" },
            { label: "Skipped", value: stats.skipped, color: "text-gray-500" },
            { label: "Errors", value: stats.errors, color: "text-red-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-lg">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(["all", "pocket", "ingested", "skipped"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f
                  ? "bg-teal-600 text-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({
                f === "all" ? stats.total :
                f === "pocket" ? stats.pocket :
                f === "ingested" ? stats.ingested :
                stats.skipped
              })
            </button>
          ))}
        </div>

        {/* Email table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">No processed emails yet.</p>
              <p className="text-sm">
                {emails.length === 0
                  ? "Connect Gmail at /api/gmail/auth to start scanning."
                  : "No emails match this filter."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">From</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Keywords</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Confidence</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((email) => (
                  <tr key={email.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-200 truncate max-w-[150px]">
                      {email.from.replace(/<.*>/, "").trim()}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 truncate max-w-[250px]">
                      {email.subject}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {email.keywords.slice(0, 3).map((kw) => (
                          <span key={kw} className="text-[10px] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                        {email.keywords.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{email.keywords.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${email.confidence > 0.7 ? "bg-green-500" : email.confidence > 0.3 ? "bg-yellow-500" : "bg-gray-400"}`}
                            style={{ width: `${Math.round(email.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{Math.round(email.confidence * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        email.status === "ingested" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        email.status === "error" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        email.status === "skipped" ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {email.status}
                      </span>
                      {email.listingId && (
                        <Link href={`/listings/${email.listingId}`} className="ml-2 text-teal-600 text-xs hover:underline">
                          View
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(email.processedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
