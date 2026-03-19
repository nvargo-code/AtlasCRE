import { ListingProvider, NormalizedListing } from "../types";

/**
 * Realtor.com commercial listings adapter.
 * Uses the unofficial search API that powers their website.
 * Filters for commercial property types by market bounding box.
 */

const MARKET_PARAMS: Record<string, { lat: number; lon: number; radius: number }> = {
  austin: { lat: 30.267, lon: -97.743, radius: 30 },
  dfw:    { lat: 32.779, lon: -96.808, radius: 40 },
};

const COMMERCIAL_PROP_TYPES = "land,multi_family,commercial";

interface RealtorProperty {
  property_id?: string;
  listing_id?: string;
  prop_type?: string;
  prop_sub_type?: string;
  address?: {
    line?: string;
    city?: string;
    state_code?: string;
    postal_code?: string;
    lat?: number;
    lon?: number;
  };
  price?: number;
  building_size?: { size?: number; units?: string };
  lot_size?: { size?: number; units?: string };
  year_built?: number;
  agents?: Array<{
    name?: string;
    office?: { name?: string };
    phones?: Array<{ number?: string; type?: string }>;
    email?: string;
  }>;
  description?: string;
  photos?: Array<{ href?: string }>;
  rdc_web_url?: string;
}

interface RealtorResponse {
  properties?: RealtorProperty[];
  data?: { home_search?: { results?: RealtorProperty[] } };
}

async function fetchRealtorPage(
  market: "austin" | "dfw",
  offset: number
): Promise<RealtorProperty[]> {
  const params = MARKET_PARAMS[market];

  const url = new URL(
    "https://www.realtor.com/api/v1/hulk_main_srp/calls/web/fetch_consumer_offmarket_properties/SearchSrpPage/glide/True"
  );
  url.searchParams.set("prop_type", COMMERCIAL_PROP_TYPES);
  url.searchParams.set("limit", "200");
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("geo_lat", String(params.lat));
  url.searchParams.set("geo_lon", String(params.lon));
  url.searchParams.set("radius", String(params.radius));
  url.searchParams.set("pgsz", "200");
  url.searchParams.set("schema", "legacyapp");
  url.searchParams.set("sort", "relevance");

  const res = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.realtor.com/",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`Realtor.com API error: ${res.status} ${res.statusText}`);
  }

  const data: RealtorResponse = await res.json();
  return (
    data.properties ??
    data.data?.home_search?.results ??
    []
  );
}

function normalizeProperty(
  prop: RealtorProperty,
  market: "austin" | "dfw"
): NormalizedListing | null {
  const address = prop.address?.line ?? "";
  const city = prop.address?.city ?? "";
  const state = prop.address?.state_code ?? "TX";
  const zip = prop.address?.postal_code;
  const lat = prop.address?.lat ?? 0;
  const lng = prop.address?.lon ?? 0;

  if (!address || !city || !lat || !lng) return null;

  const id = prop.property_id ?? prop.listing_id;
  if (!id) return null;

  const agent = prop.agents?.[0];
  const phone = agent?.phones?.find((p) => p.type === "mobile" || p.type === "work")?.number
    ?? agent?.phones?.[0]?.number;

  const propType = prop.prop_type ?? "Commercial";
  const listingType = "sale"; // Realtor.com hulk endpoint is sale/for-sale focused

  const buildingSf = prop.building_size?.units === "sqft"
    ? prop.building_size.size
    : undefined;

  const lotAcres = prop.lot_size?.units === "acres"
    ? prop.lot_size.size
    : prop.lot_size?.units === "sqft" && prop.lot_size.size
    ? prop.lot_size.size / 43560
    : undefined;

  return {
    externalId: String(id),
    sourceSlug: "realtor",
    address,
    city,
    state,
    zip,
    lat,
    lng,
    market,
    propertyType: propType,
    listingType,
    buildingSf,
    lotSizeAcres: lotAcres,
    yearBuilt: prop.year_built ?? undefined,
    priceAmount: prop.price ?? undefined,
    priceUnit: "total",
    brokerName: agent?.name,
    brokerCompany: agent?.office?.name,
    brokerPhone: phone,
    brokerEmail: agent?.email,
    description: prop.description,
    imageUrl: prop.photos?.[0]?.href,
    sourceUrl: prop.rdc_web_url,
    rawData: prop as Record<string, unknown>,
  };
}

export const realtorProvider: ListingProvider = {
  slug: "realtor",
  name: "Realtor.com",

  async fetchListings(market): Promise<NormalizedListing[]> {
    console.log(`[realtor] Fetching ${market} listings...`);
    const listings: NormalizedListing[] = [];

    for (let offset = 0; offset < 600; offset += 200) {
      try {
        const props = await fetchRealtorPage(market, offset);
        if (props.length === 0) break;

        for (const prop of props) {
          const normalized = normalizeProperty(prop, market);
          if (normalized) listings.push(normalized);
        }

        if (props.length < 200) break;
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`[realtor] offset=${offset} error:`, err);
        break;
      }
    }

    console.log(`[realtor] ${market}: ${listings.length} listings`);
    return listings;
  },
};
