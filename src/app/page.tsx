"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { Header } from "@/components/Header";
import { Map } from "@/components/Map";
import { FilterPanel } from "@/components/FilterPanel";
import { FilterChips } from "@/components/FilterChips";
import { ListingDetail } from "@/components/ListingDetail";
import { ListingList } from "@/components/ListingList";
import { SearchBar } from "@/components/SearchBar";
import { ExportButton } from "@/components/ExportButton";
import { SaveSearchDialog } from "@/components/SaveSearchDialog";
import { ListingFilters, ListingWithVariants } from "@/types";

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ListingFilters>({});
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [availableSources, setAvailableSources] = useState<{ slug: string; name: string }[]>([]);
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [listings, setListings] = useState<ListingWithVariants[]>([]);
  const [selectedListing, setSelectedListing] = useState<ListingWithVariants | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list" | "split">("split");
  const boundsRef = useRef<ListingFilters["bounds"]>(undefined);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialLoadDone = useRef(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load available sources
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/sources").then((r) => r.json()).then(setAvailableSources).catch(() => {});
    }
  }, [status]);

  // Sync filters from URL on mount (once)
  useEffect(() => {
    const f: ListingFilters = {};
    const market = searchParams.get("market");
    if (market === "austin" || market === "dfw") f.market = market;
    const pt = searchParams.get("propertyType");
    if (pt) f.propertyType = pt.split(",") as ListingFilters["propertyType"];
    const lt = searchParams.get("listingType");
    if (lt) f.listingType = lt.split(",") as ListingFilters["listingType"];
    const q = searchParams.get("q");
    if (q) f.query = q;
    setFilters(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.market) params.set("market", filters.market);
    if (filters.propertyType?.length) params.set("propertyType", filters.propertyType.join(","));
    if (filters.listingType?.length) params.set("listingType", filters.listingType.join(","));
    if (filters.query) params.set("q", filters.query);
    if (filters.priceMin) params.set("priceMin", filters.priceMin.toString());
    if (filters.priceMax) params.set("priceMax", filters.priceMax.toString());
    if (filters.sfMin) params.set("sfMin", filters.sfMin.toString());
    if (filters.sfMax) params.set("sfMax", filters.sfMax.toString());
    const url = params.toString() ? `?${params.toString()}` : "/";
    router.replace(url, { scroll: false });
  }, [filters, router]);

  // Stable fetch function that reads from refs
  const doFetch = useCallback(async () => {
    if (status !== "authenticated") return;

    const f = filtersRef.current;
    const params = new URLSearchParams();
    if (f.market) params.set("market", f.market);
    if (f.propertyType?.length) params.set("propertyType", f.propertyType.join(","));
    if (f.listingType?.length) params.set("listingType", f.listingType.join(","));
    if (f.priceMin) params.set("priceMin", f.priceMin.toString());
    if (f.priceMax) params.set("priceMax", f.priceMax.toString());
    if (f.sfMin) params.set("sfMin", f.sfMin.toString());
    if (f.sfMax) params.set("sfMax", f.sfMax.toString());
    if (f.query) params.set("q", f.query);
    if (f.brokerCompany) params.set("brokerCompany", f.brokerCompany);
    if (f.sources?.length) params.set("sources", f.sources.join(","));

    const bounds = boundsRef.current;
    if (bounds) {
      params.set("north", bounds.north.toString());
      params.set("south", bounds.south.toString());
      params.set("east", bounds.east.toString());
      params.set("west", bounds.west.toString());
    }

    const geoParams = new URLSearchParams(params);
    geoParams.set("format", "geojson");
    const listParams = new URLSearchParams(params);
    listParams.set("limit", "50");

    const [geoRes, listRes] = await Promise.all([
      fetch(`/api/listings?${geoParams}`),
      fetch(`/api/listings?${listParams}`),
    ]);

    if (geoRes.ok) {
      const data = await geoRes.json();
      setGeojson(data);
    }
    if (listRes.ok) {
      const data = await listRes.json();
      setListings(data.listings || []);
    }
  }, [status]);

  // Re-fetch when filters change
  useEffect(() => {
    doFetch();
  }, [filters, doFetch]);

  // Debounced bounds change handler
  const handleBoundsChange = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    boundsRef.current = bounds;
    // Skip the very first bounds emission (map init) to avoid double-fetch
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doFetch();
    }, 300);
  }, [doFetch]);

  async function handleMarkerClick(id: string) {
    const res = await fetch(`/api/listings/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedListing(data);
    }
  }

  async function handleToggleFavorite(listingId: string, isFavorited: boolean) {
    if (isFavorited) {
      await fetch(`/api/favorites/${listingId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/favorites/${listingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    }
    // Refresh the selected listing
    if (selectedListing?.id === listingId) {
      const res = await fetch(`/api/listings/${listingId}`);
      if (res.ok) setSelectedListing(await res.json());
    }
  }

  async function handleSaveSearch(name: string) {
    await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, filters }),
    });
    setSaveDialogOpen(false);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="h-screen flex flex-col">
      <Header />

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={filters.query || ""}
            onChange={(q) => setFilters({ ...filters, query: q || undefined })}
          />
        </div>

        {/* View mode toggle */}
        <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          {(["map", "split", "list"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                viewMode === mode
                  ? "bg-teal-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSaveDialogOpen(true)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Save Search
        </button>

        <ExportButton filters={filters} />
      </div>

      {/* Source toggles */}
      {availableSources.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-x-auto">
          <span className="text-xs text-gray-400 shrink-0">Sources:</span>
          {availableSources.map((src) => {
            const active = !filters.sources || filters.sources.includes(src.slug);
            return (
              <button
                key={src.slug}
                onClick={() => {
                  const all = availableSources.map((s) => s.slug);
                  const current = filters.sources ?? all;
                  const next = current.includes(src.slug)
                    ? current.filter((s) => s !== src.slug)
                    : [...current, src.slug];
                  setFilters({ ...filters, sources: next.length === all.length ? undefined : next });
                }}
                className={`px-2.5 py-0.5 text-xs rounded-full border transition-colors shrink-0 ${
                  active
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                }`}
              >
                {src.name}
              </button>
            );
          })}
        </div>
      )}

      <FilterChips filters={filters} onChange={setFilters} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          open={filterPanelOpen}
          onToggle={() => setFilterPanelOpen(!filterPanelOpen)}
        />

        {/* Map */}
        {(viewMode === "map" || viewMode === "split") && (
          <div className="flex-1 relative">
            <Map
              geojson={geojson}
              onBoundsChange={handleBoundsChange}
              onMarkerClick={handleMarkerClick}
            />
          </div>
        )}

        {/* List */}
        {(viewMode === "list" || viewMode === "split") && (
          <div className={`${viewMode === "split" ? "w-80" : "flex-1"} border-l border-gray-200 dark:border-gray-800 overflow-y-auto bg-white dark:bg-gray-950`}>
            <ListingList
              listings={listings.map((l) => ({
                id: l.id,
                address: l.address,
                city: l.city,
                propertyType: l.propertyType,
                listingType: l.listingType,
                priceAmount: l.priceAmount,
                priceUnit: l.priceUnit,
                buildingSf: l.buildingSf,
                status: l.status,
              }))}
              onSelect={handleMarkerClick}
              selectedId={selectedListing?.id}
            />
          </div>
        )}

        {/* Detail panel */}
        {selectedListing && (
          <ListingDetail
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </div>

      <SaveSearchDialog
        filters={filters}
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveSearch}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
