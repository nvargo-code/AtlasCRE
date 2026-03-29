import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Simple in-memory cache: key -> { count, timestamp }
const cache = new Map<string, { count: number; ts: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

interface ZillowSearchState {
  mapBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  filterState?: Record<string, { min?: number; max?: number } | unknown>;
  regionSelection?: Array<{ regionId: number; regionType: number }>;
  isListVisible?: boolean;
  isMapVisible?: boolean;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const location = params.get("location"); // zip code or city name
  if (!location) {
    return NextResponse.json({ error: "location param required" }, { status: 400 });
  }

  const priceMin = params.get("priceMin");
  const priceMax = params.get("priceMax");
  const bedsMin = params.get("bedsMin");
  const bathsMin = params.get("bathsMin");

  // Build cache key
  const cacheKey = [location, priceMin, priceMax, bedsMin, bathsMin].join("|");
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ count: cached.count, location, cached: true });
  }

  try {
    const count = await fetchZillowCount(location, {
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      bedsMin: bedsMin ? Number(bedsMin) : undefined,
      bathsMin: bathsMin ? Number(bathsMin) : undefined,
    });

    cache.set(cacheKey, { count, ts: Date.now() });
    return NextResponse.json({ count, location });
  } catch (err) {
    console.error("[zillow-count]", err);
    return NextResponse.json({ count: null, location, error: "unavailable" });
  }
}

interface ZillowFilters {
  priceMin?: number;
  priceMax?: number;
  bedsMin?: number;
  bathsMin?: number;
}

async function fetchZillowCount(
  location: string,
  filters: ZillowFilters
): Promise<number> {
  // Step 1: Resolve location to Zillow region ID
  const regionData = await resolveZillowRegion(location);

  // Step 2: Build search query state
  const searchQueryState: ZillowSearchState = {
    isListVisible: true,
    isMapVisible: false,
    filterState: {
      sortSelection: { value: "days" },
      isAllHomes: { value: true },
    },
    regionSelection: [regionData],
  };

  // Add price filters
  if (filters.priceMin || filters.priceMax) {
    (searchQueryState.filterState as Record<string, unknown>).price = {
      ...(filters.priceMin ? { min: filters.priceMin } : {}),
      ...(filters.priceMax ? { max: filters.priceMax } : {}),
    };
  }

  // Add beds filter
  if (filters.bedsMin) {
    (searchQueryState.filterState as Record<string, unknown>).beds = {
      min: filters.bedsMin,
    };
  }

  // Add baths filter
  if (filters.bathsMin) {
    (searchQueryState.filterState as Record<string, unknown>).baths = {
      min: filters.bathsMin,
    };
  }

  // Step 3: Query Zillow search API
  const url = new URL("https://www.zillow.com/search/GetSearchPageState.htm");
  url.searchParams.set("searchQueryState", JSON.stringify(searchQueryState));
  url.searchParams.set("wants", JSON.stringify({ cat1: ["listResults"], cat2: ["total"] }));
  url.searchParams.set("requestId", String(Math.floor(Math.random() * 100)));

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
      Referer: "https://www.zillow.com/",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Zillow API error: ${res.status}`);
  }

  const data = await res.json();

  // Extract total count from response
  const totalCount =
    data?.cat1?.searchResults?.totalResultCount ??
    data?.categoryTotals?.cat1?.totalResultCount ??
    data?.searchResults?.totalResultCount ??
    0;

  return totalCount;
}

async function resolveZillowRegion(
  location: string
): Promise<{ regionId: number; regionType: number }> {
  // Try to determine if it's a zip code (all digits, 5 chars)
  const isZip = /^\d{5}$/.test(location.trim());

  if (isZip) {
    // Use Zillow's autocomplete to resolve zip to region ID
    const url = `https://www.zillowstatic.com/autocomplete/v3/suggestions?q=${encodeURIComponent(location)}&resultTypes=allSuggestions&resultCount=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(5_000),
    });

    if (res.ok) {
      const data = await res.json();
      const suggestion = data?.results?.[0];
      if (suggestion?.metaData?.regionId) {
        // regionType: 7 = zip, 6 = city, 4 = county
        return {
          regionId: Number(suggestion.metaData.regionId),
          regionType: Number(suggestion.metaData.regionType ?? 7),
        };
      }
    }
  }

  // Fallback: use autocomplete for city name
  const url = `https://www.zillowstatic.com/autocomplete/v3/suggestions?q=${encodeURIComponent(location)}&resultTypes=allSuggestions&resultCount=1`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(5_000),
  });

  if (!res.ok) {
    throw new Error(`Zillow autocomplete error: ${res.status}`);
  }

  const data = await res.json();
  const suggestion = data?.results?.[0];
  if (!suggestion?.metaData?.regionId) {
    throw new Error(`Could not resolve location: ${location}`);
  }

  return {
    regionId: Number(suggestion.metaData.regionId),
    regionType: Number(suggestion.metaData.regionType ?? 6),
  };
}
