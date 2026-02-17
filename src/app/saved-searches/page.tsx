"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { ListingFilters } from "@/types";

interface SavedSearchItem {
  id: string;
  name: string;
  filters: ListingFilters;
  createdAt: string;
}

export default function SavedSearchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/saved-searches")
      .then((r) => r.json())
      .then((data) => {
        setSearches(data);
        setLoading(false);
      });
  }, [status]);

  async function deleteSearch(id: string) {
    await fetch("/api/saved-searches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }

  function loadSearch(filters: ListingFilters) {
    const params = new URLSearchParams();
    if (filters.market) params.set("market", filters.market);
    if (filters.propertyType?.length) params.set("propertyType", filters.propertyType.join(","));
    if (filters.listingType?.length) params.set("listingType", filters.listingType.join(","));
    if (filters.query) params.set("q", filters.query);
    if (filters.priceMin) params.set("priceMin", filters.priceMin.toString());
    if (filters.priceMax) params.set("priceMax", filters.priceMax.toString());
    router.push(`/?${params.toString()}`);
  }

  function describeFilters(filters: ListingFilters): string {
    const parts: string[] = [];
    if (filters.market) parts.push(filters.market === "austin" ? "Austin" : "DFW");
    if (filters.propertyType?.length) parts.push(filters.propertyType.join(", "));
    if (filters.listingType?.length) parts.push(filters.listingType.join(", "));
    if (filters.query) parts.push(`"${filters.query}"`);
    if (filters.priceMin || filters.priceMax) {
      parts.push(`$${filters.priceMin?.toLocaleString() ?? "0"} - $${filters.priceMax?.toLocaleString() ?? "any"}`);
    }
    return parts.join(" | ") || "No filters";
  }

  if (status === "loading" || !session) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Saved Searches</h1>

        {loading ? (
          <p className="text-gray-500">Loading saved searches...</p>
        ) : searches.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No saved searches yet. Use the &quot;Save Search&quot; button on the map to save your current filters.
          </p>
        ) : (
          <div className="space-y-3">
            {searches.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{s.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {describeFilters(s.filters)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Saved {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadSearch(s.filters)}
                    className="px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteSearch(s.id)}
                    className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
