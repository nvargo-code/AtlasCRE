"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Map } from "@/components/Map";
import { ListingFilters, ListingWithVariants } from "@/types";
import { RegistrationGate } from "@/components/public/RegistrationGate";
import { SaveSearchAlert } from "@/components/public/SaveSearchAlert";
import { CompareDrawer } from "@/components/public/CompareDrawer";
import { RecentlyViewed } from "@/components/public/RecentlyViewed";
import { DrawControl } from "@/components/public/DrawControl";
import { SearchFilterChips } from "@/components/public/SearchFilterChips";
import { AreaStatsPanel } from "@/components/public/AreaStatsPanel";
import { HeatMapToggle } from "@/components/public/HeatMapToggle";
import Link from "next/link";
import maplibregl from "maplibre-gl";

type SimpleListing = {
  id: string;
  address: string;
  city: string;
  propertyType: string;
  listingType: string;
  priceAmount: number | null;
  priceUnit: string | null;
  buildingSf: number | null;
  beds: number | null;
  baths: number | null;
  propSubType: string | null;
  searchMode: string;
  imageUrl?: string | null;
};

function formatPrice(amount: number | null, unit: string | null): string {
  if (!amount) return "Price N/A";
  const formatted = amount >= 1000000
    ? `$${(amount / 1000000).toFixed(1)}M`
    : amount >= 1000
    ? `$${(amount / 1000).toFixed(0)}K`
    : `$${amount.toLocaleString()}`;
  if (unit === "per_sf_yr") return `${formatted}/SF/YR`;
  if (unit === "per_sf_mo") return `${formatted}/SF/MO`;
  if (unit === "per_sf") return `${formatted}/SF`;
  return formatted;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"residential" | "commercial">(
    (searchParams.get("searchMode") as "residential" | "commercial") || "residential"
  );
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<ListingFilters>({});
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [listings, setListings] = useState<SimpleListing[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [zillowCount, setZillowCount] = useState<number | null>(null);
  const [zillowLoading, setZillowLoading] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [compareList, setCompareList] = useState<SimpleListing[]>([]);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [currentBounds, setCurrentBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);

  function toggleCompare(listing: SimpleListing) {
    setCompareList((prev) => {
      const exists = prev.find((l) => l.id === listing.id);
      if (exists) return prev.filter((l) => l.id !== listing.id);
      if (prev.length >= 3) return prev; // Max 3
      return [...prev, listing];
    });
  }
  const [selectedListing, setSelectedListing] = useState<ListingWithVariants | null>(null);

  const boundsRef = useRef<ListingFilters["bounds"]>(undefined);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialLoadDone = useRef(false);

  // Sync mode/query into filters
  useEffect(() => {
    const f: ListingFilters = { searchMode: mode };
    const q = searchParams.get("q");
    if (q) { f.query = q; setQuery(q); }
    const pt = searchParams.get("propertyType");
    if (pt) f.propertyType = pt.split(",") as ListingFilters["propertyType"];
    const priceMin = searchParams.get("priceMin");
    if (priceMin) f.priceMin = Number(priceMin);
    const priceMax = searchParams.get("priceMax");
    if (priceMax) f.priceMax = Number(priceMax);
    const bedsMin = searchParams.get("bedsMin");
    if (bedsMin) f.bedsMin = Number(bedsMin);
    const bathsMin = searchParams.get("bathsMin");
    if (bathsMin) f.bathsMin = Number(bathsMin);
    const market = searchParams.get("market");
    if (market === "austin" || market === "dfw") f.market = market;
    const lt = searchParams.get("listingType");
    if (lt) f.listingType = lt.split(",") as ListingFilters["listingType"];
    const sfMin = searchParams.get("sfMin");
    if (sfMin) f.sfMin = Number(sfMin);
    const pst = searchParams.get("propSubType");
    if (pst) f.propSubType = pst.split(",") as ListingFilters["propSubType"];
    const yb = searchParams.get("yearBuiltMin");
    if (yb) f.yearBuiltMin = Number(yb);
    setFilters(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doFetch = useCallback(async () => {
    const f = filtersRef.current;
    const params = new URLSearchParams();
    if (f.searchMode) params.set("searchMode", f.searchMode);
    if (f.market) params.set("market", f.market);
    if (f.propertyType?.length) params.set("propertyType", f.propertyType.join(","));
    if (f.listingType?.length) params.set("listingType", f.listingType.join(","));
    if (f.priceMin) params.set("priceMin", f.priceMin.toString());
    if (f.priceMax) params.set("priceMax", f.priceMax.toString());
    if (f.query) params.set("q", f.query);
    if (f.bedsMin) params.set("bedsMin", f.bedsMin.toString());
    if (f.bathsMin) params.set("bathsMin", f.bathsMin.toString());
    if (f.propSubType?.length) params.set("propSubType", f.propSubType.join(","));

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

    if (geoRes.ok) setGeojson(await geoRes.json());
    if (listRes.ok) {
      const data = await listRes.json();
      setListings(data.listings || []);
      setTotalCount(data.pagination?.total ?? 0);
      setHasMore((data.pagination?.page ?? 1) < (data.pagination?.totalPages ?? 1));
    }

    // Zillow comparison for residential
    if (f.searchMode === "residential") {
      setZillowLoading(true);
      try {
        // Use query if available, otherwise fall back to market name
        const location = f.query || f.market || "austin";
        const zParams = new URLSearchParams({ location });
        if (f.priceMin) zParams.set("priceMin", f.priceMin.toString());
        if (f.priceMax) zParams.set("priceMax", f.priceMax.toString());
        if (f.bedsMin) zParams.set("bedsMin", f.bedsMin.toString());
        if (f.bathsMin) zParams.set("bathsMin", f.bathsMin.toString());
        const zRes = await fetch(`/api/zillow-count?${zParams}`);
        if (zRes.ok) {
          const zData = await zRes.json();
          setZillowCount(zData.count);
        } else {
          setZillowCount(null);
        }
      } catch {
        setZillowCount(null);
      } finally {
        setZillowLoading(false);
      }
    } else {
      setZillowCount(null);
    }
  }, []);

  useEffect(() => { doFetch(); }, [filters, doFetch]);

  // Sync filters to URL for shareable searches
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.searchMode) params.set("searchMode", filters.searchMode);
    if (filters.query) params.set("q", filters.query);
    if (filters.market) params.set("market", filters.market);
    if (filters.priceMin) params.set("priceMin", filters.priceMin.toString());
    if (filters.priceMax) params.set("priceMax", filters.priceMax.toString());
    if (filters.bedsMin) params.set("bedsMin", filters.bedsMin.toString());
    if (filters.bathsMin) params.set("bathsMin", filters.bathsMin.toString());
    if (filters.propertyType?.length) params.set("propertyType", filters.propertyType.join(","));
    if (filters.listingType?.length) params.set("listingType", filters.listingType.join(","));
    if (filters.sfMin) params.set("sfMin", filters.sfMin.toString());
    if (filters.yearBuiltMin) params.set("yearBuiltMin", filters.yearBuiltMin.toString());
    if (filters.propSubType?.length) params.set("propSubType", filters.propSubType.join(","));
    const url = params.toString() ? `/search?${params.toString()}` : "/search";
    router.replace(url, { scroll: false });
  }, [filters, router]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const f = filtersRef.current;
    const params = new URLSearchParams();
    if (f.searchMode) params.set("searchMode", f.searchMode);
    if (f.market) params.set("market", f.market);
    if (f.propertyType?.length) params.set("propertyType", f.propertyType.join(","));
    if (f.listingType?.length) params.set("listingType", f.listingType.join(","));
    if (f.priceMin) params.set("priceMin", f.priceMin.toString());
    if (f.priceMax) params.set("priceMax", f.priceMax.toString());
    if (f.query) params.set("q", f.query);
    if (f.bedsMin) params.set("bedsMin", f.bedsMin.toString());
    if (f.bathsMin) params.set("bathsMin", f.bathsMin.toString());
    if (f.propSubType?.length) params.set("propSubType", f.propSubType.join(","));
    if (f.sfMin) params.set("sfMin", f.sfMin.toString());
    if (f.yearBuiltMin) params.set("yearBuiltMin", f.yearBuiltMin.toString());
    const bounds = boundsRef.current;
    if (bounds) {
      params.set("north", bounds.north.toString());
      params.set("south", bounds.south.toString());
      params.set("east", bounds.east.toString());
      params.set("west", bounds.west.toString());
    }
    const nextPage = Math.floor(listings.length / 50) + 1;
    params.set("page", (nextPage + 1).toString());
    params.set("limit", "50");
    const res = await fetch(`/api/listings?${params}`);
    if (res.ok) {
      const data = await res.json();
      setListings((prev) => [...prev, ...(data.listings || [])]);
      setHasMore((data.pagination?.page ?? 1) < (data.pagination?.totalPages ?? 1));
    }
    setLoadingMore(false);
  }

  const handleBoundsChange = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    boundsRef.current = bounds;
    setCurrentBounds(bounds);
    if (!initialLoadDone.current) { initialLoadDone.current = true; return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetch(), 300);
  }, [doFetch]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const newFilters = { ...filters, searchMode: mode as "residential" | "commercial", query: query || undefined };
    setFilters(newFilters);
    const params = new URLSearchParams();
    params.set("searchMode", mode);
    if (query) params.set("q", query);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  async function handleMarkerClick(id: string) {
    const res = await fetch(`/api/listings/${id}`);
    if (res.ok) setSelectedListing(await res.json());
  }

  const advantage = zillowCount !== null ? totalCount - zillowCount : 0;

  return (
    <div className="min-h-screen pt-20">
      {/* Search bar */}
      <div className="bg-navy">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-white text-lg font-semibold tracking-wide">SuperSearch</h1>
            <span className="text-gold text-[11px] font-semibold tracking-[0.15em] uppercase px-2 py-0.5 border border-gold/40 rounded-sm">
              Beta
            </span>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-0">
            {/* Mode toggle */}
            <div className="flex">
              {(["residential", "commercial"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setFilters({ ...filters, searchMode: m }); }}
                  className={`px-5 py-3 text-[12px] font-semibold tracking-[0.1em] uppercase transition-all ${
                    mode === m
                      ? "bg-white text-navy"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by address, city, ZIP, or neighborhood..."
              className="flex-1 bg-white/5 border border-white/20 px-5 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
            />
            <button
              type="submit"
              className="bg-gold hover:bg-gold-dark text-white px-8 py-3 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors"
            >
              Search
            </button>
          </form>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-3 mt-4">
            {mode === "residential" ? (
              <>
                {/* Residential filters */}
                <select
                  className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold"
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Any Price</option>
                  <option value="300000">Under $300K</option>
                  <option value="500000">Under $500K</option>
                  <option value="750000">Under $750K</option>
                  <option value="1000000">Under $1M</option>
                  <option value="2000000">Under $2M</option>
                </select>
                <select
                  className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold"
                  onChange={(e) => setFilters({ ...filters, bedsMin: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Beds</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
                <select
                  className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold"
                  onChange={(e) => setFilters({ ...filters, bathsMin: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Baths</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </>
            ) : (
              <>
                {/* Commercial filters */}
                <select
                  className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold"
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters({ ...filters, propertyType: val ? [val] as ListingFilters["propertyType"] : undefined });
                  }}
                >
                  <option value="">Property Type</option>
                  <option value="Office">Office</option>
                  <option value="Retail">Retail</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Multifamily">Multifamily</option>
                  <option value="Land">Land</option>
                  <option value="Mixed Use">Mixed Use</option>
                  <option value="Hospitality">Hospitality</option>
                </select>
                <select
                  className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold"
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters({ ...filters, listingType: val ? [val] as ListingFilters["listingType"] : undefined });
                  }}
                >
                  <option value="">Sale / Lease</option>
                  <option value="Sale">For Sale</option>
                  <option value="Lease">For Lease</option>
                  <option value="Sublease">Sublease</option>
                </select>
                <select
                  className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold"
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Any Price</option>
                  <option value="500000">Under $500K</option>
                  <option value="1000000">Under $1M</option>
                  <option value="5000000">Under $5M</option>
                  <option value="10000000">Under $10M</option>
                  <option value="25000000">Under $25M</option>
                </select>
                <select
                  className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold"
                  onChange={(e) => setFilters({ ...filters, sfMin: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Min SF</option>
                  <option value="1000">1,000+ SF</option>
                  <option value="5000">5,000+ SF</option>
                  <option value="10000">10,000+ SF</option>
                  <option value="25000">25,000+ SF</option>
                  <option value="50000">50,000+ SF</option>
                </select>
              </>
            )}
            {/* Shared filters */}
            <select
              className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold"
              onChange={(e) => setFilters({ ...filters, market: e.target.value as "austin" | "dfw" | undefined || undefined })}
            >
              <option value="">All Markets</option>
              <option value="austin">Austin</option>
              <option value="dfw">DFW</option>
            </select>
            <select
              className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold"
              onChange={(e) => setFilters({ ...filters, yearBuiltMin: e.target.value ? Number(e.target.value) : undefined })}
            >
              <option value="">Year Built</option>
              <option value="2020">2020+</option>
              <option value="2010">2010+</option>
              <option value="2000">2000+</option>
              <option value="1990">1990+</option>
              <option value="1980">1980+</option>
            </select>
            {mode === "residential" && (
              <select
                className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold"
                onChange={(e) => setFilters({ ...filters, sfMin: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Min Sqft</option>
                <option value="1000">1,000+ SF</option>
                <option value="1500">1,500+ SF</option>
                <option value="2000">2,000+ SF</option>
                <option value="2500">2,500+ SF</option>
                <option value="3000">3,000+ SF</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* SuperSearch comparison bar */}
      {mode === "residential" && (totalCount > 0 || zillowLoading) && (
        <div className="bg-warm-gray border-b border-navy/10">
          <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-navy/50">SuperSearch</span>
                  <span className="ml-2 text-xl font-bold text-navy">{totalCount.toLocaleString()}</span>
                  <span className="ml-1 text-sm text-navy/50">listings</span>
                </div>
                <div className="w-[1px] h-6 bg-navy/10" />
                <div>
                  <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray">Zillow</span>
                  {zillowLoading ? (
                    <span className="ml-2 text-sm text-mid-gray animate-pulse">checking...</span>
                  ) : zillowCount !== null ? (
                    <>
                      <span className="ml-2 text-xl font-bold text-mid-gray">{zillowCount.toLocaleString()}</span>
                      <span className="ml-1 text-sm text-mid-gray">listings</span>
                    </>
                  ) : (
                    <span className="ml-2 text-sm text-mid-gray">N/A</span>
                  )}
                </div>
              </div>

              {advantage > 0 && (
                <button
                  onClick={() => setShowGate(true)}
                  className="bg-gold text-white px-5 py-2 text-[12px] font-semibold tracking-[0.1em] uppercase hover:bg-gold-dark transition-colors"
                >
                  See {advantage.toLocaleString()} more listings &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <SearchFilterChips filters={filters} onChange={setFilters} />

      {/* Recently viewed */}
      <RecentlyViewed />

      {/* Mobile view toggle */}
      <div className="lg:hidden flex border-b border-navy/10">
        {(["map", "list"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={`flex-1 py-2.5 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors ${
              mobileView === v
                ? "bg-navy text-white"
                : "bg-white text-mid-gray"
            }`}
          >
            {v === "map" ? "Map View" : `List (${totalCount})`}
          </button>
        ))}
      </div>

      {/* Main content: Map + List */}
      <div className="flex flex-col lg:flex-row" style={{ height: "calc(100vh - 260px)" }}>
        {/* Map */}
        <div className={`flex-1 relative min-h-[400px] ${mobileView === "list" ? "hidden lg:block" : ""}`}>
          <DrawControl
            map={mapInstance}
            onPolygonComplete={(polygon) => {
              // Calculate bounding box from polygon
              const lngs = polygon.map((p) => p[0]);
              const lats = polygon.map((p) => p[1]);
              boundsRef.current = {
                north: Math.max(...lats),
                south: Math.min(...lats),
                east: Math.max(...lngs),
                west: Math.min(...lngs),
              };
              doFetch();
            }}
            onClear={() => {
              // Reset to map's current bounds
              if (mapInstance) {
                const b = mapInstance.getBounds();
                boundsRef.current = {
                  north: b.getNorth(),
                  south: b.getSouth(),
                  east: b.getEast(),
                  west: b.getWest(),
                };
                doFetch();
              }
            }}
          />
          <Map
            geojson={geojson}
            onBoundsChange={handleBoundsChange}
            onMarkerClick={handleMarkerClick}
            onMapReady={setMapInstance}
          />
          <HeatMapToggle map={mapInstance} geojson={geojson} />
          <AreaStatsPanel bounds={currentBounds} searchMode={mode} />
        </div>

        {/* Results sidebar */}
        <div className={`w-full lg:w-[380px] bg-white border-l border-navy/10 overflow-y-auto ${mobileView === "map" ? "hidden lg:block" : ""}`}>
          <div className="p-4 border-b border-navy/10 flex items-center justify-between">
            <p className="text-[12px] font-semibold tracking-[0.1em] uppercase text-mid-gray">
              {totalCount.toLocaleString()} Results
            </p>
            {totalCount > 0 && (
              <button
                onClick={() => setShowSaveAlert(true)}
                className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark transition-colors"
              >
                Save Search
              </button>
            )}
          </div>

          {listings.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-mid-gray text-sm">Search a location to see listings</p>
            </div>
          ) : (
            <div>
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleMarkerClick(listing.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleMarkerClick(listing.id)}
                  className={`w-full text-left p-4 border-b border-navy/5 hover:bg-warm-gray transition-colors cursor-pointer ${
                    selectedListing?.id === listing.id ? "bg-warm-gray" : ""
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-base font-semibold text-navy">
                      {formatPrice(listing.priceAmount, listing.priceUnit)}
                    </span>
                    <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-gold">
                      {listing.listingType}
                    </span>
                  </div>
                  <p className="text-sm text-navy/70 mb-1 truncate">{listing.address}</p>
                  <p className="text-[12px] text-mid-gray">{listing.city}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 text-[12px] text-mid-gray">
                      {listing.beds && <span>{listing.beds} bed</span>}
                      {listing.baths && <span>{listing.baths} bath</span>}
                      {listing.buildingSf && <span>{listing.buildingSf.toLocaleString()} SF</span>}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCompare(listing); }}
                        className={`text-[10px] font-semibold tracking-[0.08em] uppercase px-2 py-0.5 transition-colors ${
                          compareList.find((l) => l.id === listing.id)
                            ? "bg-gold text-white"
                            : "bg-navy/5 text-navy/40 hover:text-gold"
                        }`}
                      >
                        {compareList.find((l) => l.id === listing.id) ? "Added" : "Compare"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Quick save via favorites API
                          fetch(`/api/favorites/${listing.id}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({}),
                          }).catch(() => {});
                          fetch("/api/portal/activity", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ listingId: listing.id, action: "save" }),
                          }).catch(() => {});
                        }}
                        className="text-[10px] font-semibold tracking-[0.08em] uppercase px-2 py-0.5 bg-navy/5 text-navy/40 hover:text-red-500 transition-colors"
                        title="Save"
                      >
                        &#9825;
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetch("/api/portal/showings", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ listingId: listing.id }),
                          }).then(() => {
                            (e.target as HTMLButtonElement).textContent = "Requested";
                            (e.target as HTMLButtonElement).classList.add("text-green-600");
                          }).catch(() => {});
                        }}
                        className="text-[10px] font-semibold tracking-[0.08em] uppercase px-2 py-0.5 bg-navy/5 text-navy/40 hover:text-green-600 transition-colors"
                        title="Request Showing"
                      >
                        Tour
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="text-[12px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? "Loading..." : `Load More (${listings.length} of ${totalCount})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Listing detail slide-over */}
      {selectedListing && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-navy/10 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy truncate">
              {selectedListing.address}
            </h2>
            <button
              onClick={() => setSelectedListing(null)}
              className="text-mid-gray hover:text-navy transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {selectedListing.imageUrl && (
              <div className="aspect-video bg-warm-gray relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedListing.imageUrl}
                  alt={selectedListing.address}
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            <div>
              <p className="text-2xl font-bold text-navy mb-1">
                {formatPrice(selectedListing.priceAmount, selectedListing.priceUnit)}
              </p>
              <p className="text-mid-gray text-sm">
                {selectedListing.address}, {selectedListing.city}, {selectedListing.state} {selectedListing.zip}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selectedListing.beds && (
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray">Beds</p>
                  <p className="text-navy font-semibold">{selectedListing.beds}</p>
                </div>
              )}
              {selectedListing.baths && (
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray">Baths</p>
                  <p className="text-navy font-semibold">{selectedListing.baths}</p>
                </div>
              )}
              {selectedListing.buildingSf && (
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray">Square Feet</p>
                  <p className="text-navy font-semibold">{selectedListing.buildingSf.toLocaleString()}</p>
                </div>
              )}
              {selectedListing.yearBuilt && (
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray">Year Built</p>
                  <p className="text-navy font-semibold">{selectedListing.yearBuilt}</p>
                </div>
              )}
              {selectedListing.propertyType && (
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray">Type</p>
                  <p className="text-navy font-semibold">{selectedListing.propSubType || selectedListing.propertyType}</p>
                </div>
              )}
              {selectedListing.lotSizeAcres && (
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray">Lot Size</p>
                  <p className="text-navy font-semibold">{selectedListing.lotSizeAcres} acres</p>
                </div>
              )}
            </div>

            {selectedListing.description && (
              <div>
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">Description</p>
                <p className="text-sm text-navy/70 leading-relaxed">{selectedListing.description}</p>
              </div>
            )}

            {/* Sources */}
            {selectedListing.variants.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-3">Sources</p>
                <div className="space-y-2">
                  {selectedListing.variants.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-warm-gray">
                      <span className="text-sm font-medium text-navy">{v.sourceName}</span>
                      {v.sourceUrl && (
                        <a
                          href={v.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold tracking-[0.1em] uppercase text-gold hover:text-gold-dark"
                        >
                          View &rarr;
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact CTA */}
            <div className="bg-navy p-6 text-center">
              <p className="text-white font-semibold mb-2">Interested in this property?</p>
              <p className="text-white/50 text-sm mb-4">Schedule a showing or get more details</p>
              <Link href="/contact" className="btn-primary w-full">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Registration gate modal */}
      {showGate && (
        <RegistrationGate
          advantage={advantage}
          onClose={() => setShowGate(false)}
        />
      )}

      {/* Compare drawer */}
      <CompareDrawer
        listings={compareList}
        onRemove={(id) => setCompareList((prev) => prev.filter((l) => l.id !== id))}
        onClear={() => setCompareList([])}
      />

      {/* Save search alert modal */}
      {showSaveAlert && (
        <SaveSearchAlert
          searchCriteria={{
            searchMode: mode,
            q: query,
            priceMax: filters.priceMax,
            bedsMin: filters.bedsMin,
            bathsMin: filters.bathsMin,
          }}
          onClose={() => setShowSaveAlert(false)}
        />
      )}
    </div>
  );
}

export function PublicSearchClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-mid-gray">Loading SuperSearch...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
