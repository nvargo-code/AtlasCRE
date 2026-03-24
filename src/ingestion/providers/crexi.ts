import { ListingProvider, NormalizedListing } from "../types";

/**
 * Crexi commercial listings adapter.
 * Uses Crexi's internal REST API (reverse-engineered from their frontend).
 * Geographic bounds filter by market area.
 */

const MARKET_BOUNDS = {
  austin: { north: 30.627, south: 30.049, east: -97.421, west: -97.968 },
  dfw:    { north: 33.261, south: 32.518, east: -96.463, west: -97.478 },
};

const MARKET_CITIES: Record<string, string[]> = {
  austin: ["Austin", "Round Rock", "Cedar Park", "Georgetown", "Pflugerville", "Kyle", "Buda", "Manor", "Leander"],
  dfw:    ["Dallas", "Fort Worth", "Plano", "Irving", "Garland", "Frisco", "McKinney", "Arlington", "Denton"],
};

interface CrexiAsset {
  id: string;
  name?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  location?: { lat?: number; lng?: number };
  coordinates?: { latitude?: number; longitude?: number };
  propertyTypes?: string[];
  propertyType?: string;
  transactionType?: string;
  listingType?: string;
  buildingSize?: number;
  lotSize?: number;
  yearBuilt?: number;
  askingPrice?: number;
  pricePerSf?: number;
  contacts?: Array<{
    name?: string;
    company?: string;
    phone?: string;
    email?: string;
  }>;
  description?: string;
  photos?: Array<{ url?: string }>;
  slug?: string;
}

interface CrexiResponse {
  total?: number;
  assets?: CrexiAsset[];
  data?: CrexiAsset[];
}

async function fetchCrexiPage(
  market: "austin" | "dfw",
  page: number
): Promise<CrexiAsset[]> {
  const bounds = MARKET_BOUNDS[market];

  const body = {
    northBound: bounds.north,
    southBound: bounds.south,
    eastBound: bounds.east,
    westBound: bounds.west,
    transactionTypes: ["sale", "lease"],
    page,
    pageSize: 100,
  };

  const res = await fetch("https://api.crexi.com/assets/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Origin": "https://www.crexi.com",
      "Referer": "https://www.crexi.com/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`Crexi API error: ${res.status} ${res.statusText}`);
  }

  const data: CrexiResponse = await res.json();
  return data.assets ?? data.data ?? [];
}

function normalizeAsset(asset: CrexiAsset, market: "austin" | "dfw"): NormalizedListing | null {
  const address = asset.address?.line1 ?? "";
  const city = asset.address?.city ?? "";
  const state = asset.address?.state ?? "TX";
  const zip = asset.address?.zip;

  if (!address || !city) return null;

  // Accept listings in the right metro area
  const citiesForMarket = MARKET_CITIES[market];
  if (!citiesForMarket.some((c) => city.toLowerCase().includes(c.toLowerCase()))) {
    return null;
  }

  const lat =
    asset.location?.lat ??
    asset.coordinates?.latitude ??
    0;
  const lng =
    asset.location?.lng ??
    asset.coordinates?.longitude ??
    0;

  if (!lat || !lng) return null;

  const broker = asset.contacts?.[0];
  const propertyType = asset.propertyTypes?.[0] ?? asset.propertyType ?? "Commercial";
  const listingTypeRaw = (asset.transactionType ?? asset.listingType ?? "sale").toLowerCase();
  const listingType = listingTypeRaw.includes("lease") ? "lease" : "sale";

  return {
    externalId: String(asset.id),
    sourceSlug: "crexi",
    address,
    city,
    state,
    zip,
    lat,
    lng,
    market,
    propertyType,
    listingType,
    buildingSf: asset.buildingSize ?? undefined,
    lotSizeAcres: asset.lotSize ?? undefined,
    yearBuilt: asset.yearBuilt ?? undefined,
    priceAmount: asset.askingPrice ?? undefined,
    priceUnit: listingType === "lease" ? "$/SF/yr" : "total",
    brokerName: broker?.name,
    brokerCompany: broker?.company,
    brokerPhone: broker?.phone,
    brokerEmail: broker?.email,
    description: asset.description,
    imageUrl: asset.photos?.[0]?.url,
    sourceUrl: asset.slug ? `https://www.crexi.com/properties/${asset.slug}` : undefined,
    rawData: asset as unknown as Record<string, unknown>,
  };
}

export const crexiProvider: ListingProvider = {
  slug: "crexi",
  name: "Crexi",

  async fetchListings(market): Promise<NormalizedListing[]> {
    console.log(`[crexi] Fetching ${market} listings...`);
    const listings: NormalizedListing[] = [];

    for (let page = 1; page <= 5; page++) {
      try {
        const assets = await fetchCrexiPage(market, page);
        if (assets.length === 0) break;

        for (const asset of assets) {
          const normalized = normalizeAsset(asset, market);
          if (normalized) listings.push(normalized);
        }

        if (assets.length < 100) break; // last page
        await new Promise((r) => setTimeout(r, 500)); // polite delay
      } catch (err) {
        console.error(`[crexi] Page ${page} error:`, err);
        break;
      }
    }

    console.log(`[crexi] ${market}: ${listings.length} listings`);
    return listings;
  },
};
