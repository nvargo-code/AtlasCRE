"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Map } from "@/components/Map";
import { ListingFilters, ListingWithVariants } from "@/types";
import { getSourceTag, SOURCE_FILTER_OPTIONS } from "@/lib/source-tags";
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
  createdAt?: string;
  status?: string;
  lat?: number;
  lng?: number;
  variants?: { source: { slug: string } }[];
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
  if (unit === "per_month") return `${formatted}/MO`;
  return formatted;
}

/** Ray-casting point-in-polygon test */
function pointInPolygon(lng: number, lat: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function serializeFilters(f: ListingFilters): URLSearchParams {
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
  if (f.sources?.length) params.set("sources", f.sources.join(","));
  if (f.sfMin) params.set("sfMin", f.sfMin.toString());
  if (f.sfMax) params.set("sfMax", f.sfMax.toString());
  if (f.yearBuiltMin) params.set("yearBuiltMin", f.yearBuiltMin.toString());
  if (f.garageMin) params.set("garageMin", f.garageMin.toString());
  if (f.lotAcresMin) params.set("lotAcresMin", f.lotAcresMin.toString());
  if (f.lotAcresMax) params.set("lotAcresMax", f.lotAcresMax.toString());
  if (f.storiesMin) params.set("storiesMin", f.storiesMin.toString());
  if (f.hasPool) params.set("hasPool", "true");
  if (f.hasWaterfront) params.set("hasWaterfront", "true");
  if (f.hasView) params.set("hasView", "true");
  if (f.hasGuestAccommodations) params.set("hasGuestAccommodations", "true");
  if (f.hasBoatSlip) params.set("hasBoatSlip", "true");
  return params;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = "residential" as const;
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
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [acSuggestions, setAcSuggestions] = useState<{ type: string; text: string; subtext?: string; href?: string }[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const acDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);
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

  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({});
  const [sourceDropOpen, setSourceDropOpen] = useState(false);
  const [sqftDropOpen, setSqftDropOpen] = useState(false);
  const [acresDropOpen, setAcresDropOpen] = useState(false);
  const drawnPolygonRef = useRef<[number, number][] | null>(null);

  const boundsRef = useRef<ListingFilters["bounds"]>(undefined);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mapReady = useRef(false);

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
    const sfMax = searchParams.get("sfMax");
    if (sfMax) f.sfMax = Number(sfMax);
    const pst = searchParams.get("propSubType");
    if (pst) f.propSubType = pst.split(",") as ListingFilters["propSubType"];
    const yb = searchParams.get("yearBuiltMin");
    if (yb) f.yearBuiltMin = Number(yb);
    const gm = searchParams.get("garageMin");
    if (gm) f.garageMin = Number(gm);
    const lam = searchParams.get("lotAcresMin");
    if (lam) f.lotAcresMin = Number(lam);
    const lax = searchParams.get("lotAcresMax");
    if (lax) f.lotAcresMax = Number(lax);
    if (searchParams.get("hasPool") === "true") f.hasPool = true;
    if (searchParams.get("hasWaterfront") === "true") f.hasWaterfront = true;
    if (searchParams.get("hasView") === "true") f.hasView = true;
    if (searchParams.get("hasGuestAccommodations") === "true") f.hasGuestAccommodations = true;
    if (searchParams.get("hasBoatSlip") === "true") f.hasBoatSlip = true;
    const src = searchParams.get("sources");
    if (src) f.sources = src.split(",");
    setFilters(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamic page title based on search results
  useEffect(() => {
    if (totalCount > 0) {
      const area = query || (filters.market === "dfw" ? "DFW" : "Austin");
      document.title = `${totalCount.toLocaleString()} ${mode === "residential" ? "Homes" : "Properties"} in ${area} | SuperSearch`;
    } else {
      document.title = "SuperSearch | Find More Listings Than Zillow | Shapiro Group";
    }
    return () => { document.title = "SuperSearch | Shapiro Group | Austin Real Estate"; };
  }, [totalCount, query, mode, filters.market]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // '/' to focus search (when not already typing)
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search by"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
      // Escape to close modals
      if (e.key === "Escape") {
        setShowGate(false);
        setShowSaveAlert(false);
        setSelectedListing(null);
        setAcOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Load user's saved listing IDs for indicators
  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const ids = (Array.isArray(data) ? data : data.favorites || [])
          .map((f: { listingId?: string; listing?: { id: string } }) => f.listingId || f.listing?.id)
          .filter(Boolean);
        setSavedIds(new Set(ids));
      })
      .catch(() => {});
  }, []);

  const doFetch = useCallback(async () => {
    const f = filtersRef.current;
    const params = serializeFilters(f);

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
      const geo = await geoRes.json();
      if (drawnPolygonRef.current && geo.features) {
        geo.features = geo.features.filter((f: GeoJSON.Feature) => {
          const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
          return pointInPolygon(lng, lat, drawnPolygonRef.current!);
        });
      }
      setGeojson(geo);
    }
    if (listRes.ok) {
      const data = await listRes.json();
      let items = data.listings || [];
      if (drawnPolygonRef.current) {
        items = items.filter((l: SimpleListing) => {
          return l.lat && l.lng && pointInPolygon(l.lng, l.lat, drawnPolygonRef.current!);
        });
      }
      setListings(items);
      setTotalCount(drawnPolygonRef.current ? items.length : (data.pagination?.total ?? 0));
      setHasMore(drawnPolygonRef.current ? false : (data.pagination?.page ?? 1) < (data.pagination?.totalPages ?? 1));
      if (data.sourceCounts) setSourceCounts(data.sourceCounts);
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

  useEffect(() => { if (mapReady.current) doFetch(); }, [filters, doFetch]);

  // Sync filters to URL for shareable searches
  useEffect(() => {
    const params = serializeFilters(filters);
    const url = params.toString() ? `/search?${params.toString()}` : "/search";
    router.replace(url, { scroll: false });
  }, [filters, router]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const f = filtersRef.current;
    const params = serializeFilters(f);
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
    if (!mapReady.current) {
      // First bounds from map — trigger initial fetch with bounds
      mapReady.current = true;
      doFetch();
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetch(), 300);
  }, [doFetch]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const newFilters = { ...filters, searchMode: mode, query: query || undefined };
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
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  clearTimeout(acDebounce.current);
                  if (e.target.value.length >= 2) {
                    acDebounce.current = setTimeout(async () => {
                      try {
                        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(e.target.value)}`);
                        if (res.ok) {
                          const data = await res.json();
                          setAcSuggestions(data.suggestions || []);
                          setAcOpen(true);
                        }
                      } catch {}
                    }, 200);
                  } else {
                    setAcSuggestions([]);
                    setAcOpen(false);
                  }
                }}
                onFocus={() => { if (acSuggestions.length > 0) setAcOpen(true); }}
                onBlur={() => setTimeout(() => setAcOpen(false), 200)}
                placeholder="Search by address, city, ZIP, or neighborhood..."
                className="w-full bg-white/5 border border-white/20 px-5 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
              />
              {/* Autocomplete dropdown */}
              {acOpen && acSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white shadow-lg border border-navy/10 z-50 max-h-[300px] overflow-y-auto">
                  {acSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (s.href) {
                          router.push(s.href);
                        } else {
                          setQuery(s.text);
                          setAcOpen(false);
                          const f = { ...filters, query: s.text };
                          setFilters(f);
                        }
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-warm-gray transition-colors border-b border-navy/5 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 flex-shrink-0 ${
                          s.type === "neighborhood" ? "bg-gold/10 text-gold" :
                          s.type === "zip" ? "bg-blue-50 text-blue-600" :
                          s.type === "address" ? "bg-green-50 text-green-600" :
                          "bg-navy/5 text-navy/40"
                        }`}>{s.type}</span>
                        <span className="text-sm text-navy font-medium truncate">{s.text}</span>
                      </div>
                      {s.subtext && <p className="text-[11px] text-mid-gray ml-[52px]">{s.subtext}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="bg-gold hover:bg-gold-dark text-white px-8 py-3 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors"
            >
              Search
            </button>
          </form>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-3 mt-4">
                <input
                  type="number"
                  placeholder="Min Price"
                  className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 w-28 focus:outline-none focus:border-gold placeholder:text-white/30"
                  onBlur={(e) => setFilters({ ...filters, priceMin: e.target.value ? Number(e.target.value) : undefined })}
                  onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 w-28 focus:outline-none focus:border-gold placeholder:text-white/30"
                  onBlur={(e) => setFilters({ ...filters, priceMax: e.target.value ? Number(e.target.value) : undefined })}
                  onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                />
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
            <select
              className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold"
              onChange={(e) => setFilters({ ...filters, listingType: e.target.value ? [e.target.value] as ListingFilters["listingType"] : undefined })}
            >
              <option value="">Sale / Lease</option>
              <option value="sale">For Sale</option>
              <option value="lease">For Lease</option>
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
              {/* Square Footage expandable min/max */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setSqftDropOpen(!sqftDropOpen); setAcresDropOpen(false); }}
                  className={`bg-white/5 border text-[12px] tracking-wider px-4 py-2 flex items-center gap-2 ${
                    filters.sfMin || filters.sfMax ? "border-gold text-gold" : "border-white/20 text-white/70"
                  }`}
                >
                  {filters.sfMin || filters.sfMax
                    ? `${filters.sfMin?.toLocaleString() || "0"}–${filters.sfMax?.toLocaleString() || "Any"} SF`
                    : "Sqft"}
                  <svg className={`w-3 h-3 transition-transform ${sqftDropOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {sqftDropOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-navy border border-white/20 z-50 p-3 flex gap-2 items-center">
                    <input type="number" placeholder="Min" defaultValue={filters.sfMin || ""} className="bg-white/5 border border-white/20 text-white text-[12px] px-3 py-1.5 w-24 focus:outline-none focus:border-gold placeholder:text-white/30"
                      onBlur={(e) => setFilters({ ...filters, sfMin: e.target.value ? Number(e.target.value) : undefined })}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    />
                    <span className="text-white/40 text-[11px]">–</span>
                    <input type="number" placeholder="Max" defaultValue={filters.sfMax || ""} className="bg-white/5 border border-white/20 text-white text-[12px] px-3 py-1.5 w-24 focus:outline-none focus:border-gold placeholder:text-white/30"
                      onBlur={(e) => setFilters({ ...filters, sfMax: e.target.value ? Number(e.target.value) : undefined })}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    />
                    <button type="button" onClick={() => { setFilters({ ...filters, sfMin: undefined, sfMax: undefined }); setSqftDropOpen(false); }} className="text-white/40 hover:text-white text-[10px]">✕</button>
                  </div>
                )}
              </div>
              {/* Acres expandable min/max */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setAcresDropOpen(!acresDropOpen); setSqftDropOpen(false); }}
                  className={`bg-white/5 border text-[12px] tracking-wider px-4 py-2 flex items-center gap-2 ${
                    filters.lotAcresMin || filters.lotAcresMax ? "border-gold text-gold" : "border-white/20 text-white/70"
                  }`}
                >
                  {filters.lotAcresMin || filters.lotAcresMax
                    ? `${filters.lotAcresMin || "0"}–${filters.lotAcresMax || "Any"} Acres`
                    : "Acres"}
                  <svg className={`w-3 h-3 transition-transform ${acresDropOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {acresDropOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-navy border border-white/20 z-50 p-3 flex gap-2 items-center">
                    <input type="number" step="0.01" placeholder="Min" defaultValue={filters.lotAcresMin || ""} className="bg-white/5 border border-white/20 text-white text-[12px] px-3 py-1.5 w-24 focus:outline-none focus:border-gold placeholder:text-white/30"
                      onBlur={(e) => setFilters({ ...filters, lotAcresMin: e.target.value ? Number(e.target.value) : undefined })}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    />
                    <span className="text-white/40 text-[11px]">–</span>
                    <input type="number" step="0.01" placeholder="Max" defaultValue={filters.lotAcresMax || ""} className="bg-white/5 border border-white/20 text-white text-[12px] px-3 py-1.5 w-24 focus:outline-none focus:border-gold placeholder:text-white/30"
                      onBlur={(e) => setFilters({ ...filters, lotAcresMax: e.target.value ? Number(e.target.value) : undefined })}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    />
                    <button type="button" onClick={() => { setFilters({ ...filters, lotAcresMin: undefined, lotAcresMax: undefined }); setAcresDropOpen(false); }} className="text-white/40 hover:text-white text-[10px]">✕</button>
                  </div>
                )}
              </div>
              <select
                className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold"
                onChange={(e) => setFilters({ ...filters, garageMin: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Garage</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
              {/* Special features toggles */}
              {[
                { key: "hasPool", label: "Pool" },
                { key: "hasWaterfront", label: "Waterfront" },
                { key: "hasView", label: "View" },
                { key: "hasGuestAccommodations", label: "Guest" },
                { key: "hasBoatSlip", label: "Boat Slip" },
              ].map((feat) => (
                <button
                  key={feat.key}
                  type="button"
                  onClick={() => setFilters({ ...filters, [feat.key]: (filters as Record<string, unknown>)[feat.key] ? undefined : true })}
                  className={`text-[12px] tracking-wider px-4 py-2 border transition-colors ${
                    (filters as Record<string, unknown>)[feat.key]
                      ? "bg-gold/20 border-gold text-gold"
                      : "bg-white/5 border-white/20 text-white/70 hover:border-gold/40"
                  }`}
                >
                  {feat.label}
                </button>
              ))}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSourceDropOpen(!sourceDropOpen)}
                className="bg-white/5 border border-white/20 text-white/70 text-[12px] tracking-wider px-4 py-2 focus:outline-none focus:border-gold flex items-center gap-2"
              >
                {filters.sources?.length ? `Sources (${filters.sources.length})` : `All Sources (${totalCount})`}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {sourceDropOpen && (
                <div className="absolute top-full left-0 mt-1 bg-navy border border-white/20 z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setFilters({ ...filters, sources: undefined }); setSourceDropOpen(false); }}
                    className="w-full text-left px-4 py-2 text-[12px] text-white/70 hover:bg-white/10 border-b border-white/10"
                  >
                    All Sources ({totalCount})
                  </button>
                  {SOURCE_FILTER_OPTIONS.map((s) => {
                    const checked = filters.sources?.includes(s.slug) ?? false;
                    return (
                      <label key={s.slug} className="flex items-center gap-2 px-4 py-2 text-[12px] text-white/70 hover:bg-white/10 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const current = filters.sources || [];
                            const next = checked ? current.filter((x) => x !== s.slug) : [...current, s.slug];
                            setFilters({ ...filters, sources: next.length ? next : undefined });
                          }}
                          className="accent-gold"
                        />
                        {s.label} ({sourceCounts[s.slug] || 0})
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SuperSearch comparison bar */}
      {(totalCount > 0 || zillowLoading) && (
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
              // Store polygon for point-in-polygon filtering
              drawnPolygonRef.current = polygon;
              // Calculate bounding box for the API query (pre-filter)
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
              drawnPolygonRef.current = null;
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
                    <span className="text-base font-semibold text-navy flex items-center gap-1.5">
                      {formatPrice(listing.priceAmount, listing.priceUnit)}
                      {savedIds.has(listing.id) && (
                        <svg className="w-3.5 h-3.5 text-gold fill-gold inline" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      )}
                    </span>
                    <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-gold">
                      {listing.listingType}
                    </span>
                  </div>
                  <p className="text-sm text-navy/70 mb-1 truncate">{listing.address}</p>
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-[12px] text-mid-gray">{listing.city}</span>
                    {listing.propSubType && (
                      <span className="text-[9px] font-semibold tracking-wider uppercase bg-navy/5 text-navy/40 px-1.5 py-0.5">
                        {listing.propSubType}
                      </span>
                    )}
                    {listing.createdAt && (Date.now() - new Date(listing.createdAt).getTime()) < 3 * 24 * 60 * 60 * 1000 && (
                      <span className="text-[9px] font-semibold tracking-wider uppercase bg-green-50 text-green-700 px-1.5 py-0.5">
                        New
                      </span>
                    )}
                    {listing.variants?.some((v) => ["aln", "manual"].includes(v.source.slug)) && (
                      <span className="text-[9px] font-semibold tracking-wider uppercase bg-gold/10 text-gold px-1.5 py-0.5">
                        Exclusive
                      </span>
                    )}
                    {listing.variants?.map((v) => {
                      const tag = getSourceTag(v.source.slug);
                      return (
                        <span key={v.source.slug} className={`text-[9px] font-semibold tracking-wider uppercase ${tag.bg} ${tag.text} px-1.5 py-0.5`}>
                          {tag.label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-1">
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
