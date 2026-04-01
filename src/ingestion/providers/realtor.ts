import { ListingProvider, NormalizedListing } from "../types";

/**
 * Realtor.com listings adapter.
 * Uses the frontdoor GraphQL API that powers their website search.
 * Endpoint: https://www.realtor.com/frontdoor/graphql
 * Required header: rdc-client-name (e.g. "rdc-x")
 * Returns all property types (residential + commercial).
 */

const MARKET_LOCATIONS: Record<string, string> = {
  austin: "Austin, TX",
  dfw:    "Dallas-Fort Worth, TX",
};

interface RealtorProperty {
  property_id?: string;
  listing_id?: string;
  list_price?: number;
  status?: string;
  href?: string;
  description?: {
    beds?: number;
    baths?: number;
    baths_consolidated?: string;
    sqft?: number;
    lot_sqft?: number;
    garage?: number;
    type?: string;
    year_built?: number;
    stories?: number;
    text?: string;
  };
  location?: {
    address?: {
      line?: string;
      city?: string;
      state_code?: string;
      postal_code?: string;
      coordinate?: { lat?: number; lon?: number };
    };
  };
  advertisers?: Array<{
    name?: string;
    office?: { name?: string };
    phones?: Array<{ number?: string; type?: string }>;
    email?: string;
  }>;
  photos?: Array<{ href?: string }>;
  tags?: string[];
}

interface RealtorResponse {
  data?: { home_search?: { total?: number; results?: RealtorProperty[] } };
}

const GRAPHQL_QUERY = `query RealtorSearch($query: HomeSearchCriteria!, $limit: Int, $offset: Int) {
  home_search(query: $query, limit: $limit, offset: $offset) {
    total
    results {
      property_id listing_id list_price status href
      description { beds baths baths_consolidated sqft lot_sqft garage type year_built stories text }
      location { address { line city state_code postal_code coordinate { lat lon } } }
      advertisers { name office { name } phones { number type } email }
      photos { href }
      tags
    }
  }
}`;

async function fetchRealtorPage(
  market: "austin" | "dfw",
  offset: number
): Promise<RealtorProperty[]> {
  const location = MARKET_LOCATIONS[market];

  const body = {
    operationName: "RealtorSearch",
    variables: {
      query: {
        status: ["for_sale", "ready_to_build"],
        search_location: { location },
      },
      limit: 200,
      offset,
    },
    query: GRAPHQL_QUERY,
  };

  const res = await fetch("https://www.realtor.com/frontdoor/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "rdc-client-name": "rdc-x",
      "rdc-client-version": "2.0.0",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`Realtor.com API error: ${res.status} ${res.statusText}`);
  }

  const data: RealtorResponse = await res.json();
  return data.data?.home_search?.results ?? [];
}

const RESIDENTIAL_PROP_TYPES = new Set([
  "single_family", "condo", "condos", "townhomes", "townhouse",
  "multi_family", "mobile", "manufactured", "farm", "ranch", "land",
  "apartment", "co-op",
]);

function mapPropSubType(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const map: Record<string, string> = {
    single_family: "Single Family",
    condo: "Condo", condos: "Condo",
    townhomes: "Townhouse", townhouse: "Townhouse",
    multi_family: "Multi-Family",
    mobile: "Mobile/Manufactured", manufactured: "Mobile/Manufactured",
    farm: "Farm/Ranch", ranch: "Farm/Ranch",
    land: "Land",
    apartment: "Condo",
    "co-op": "Condo",
  };
  return map[raw.toLowerCase()] ?? raw;
}

function normalizeProperty(
  prop: RealtorProperty,
  market: "austin" | "dfw"
): NormalizedListing | null {
  const addr = prop.location?.address;
  const address = addr?.line ?? "";
  const city = addr?.city ?? "";
  const state = addr?.state_code ?? "TX";
  const zip = addr?.postal_code;
  const lat = addr?.coordinate?.lat ?? 0;
  const lng = addr?.coordinate?.lon ?? 0;

  if (!address || !city || !lat || !lng) return null;

  const id = prop.property_id ?? prop.listing_id;
  if (!id) return null;

  const agent = prop.advertisers?.[0];
  const phone = agent?.phones?.find((p) => p.type === "BUSINESS_PHONE" || p.type === "mobile" || p.type === "work")?.number
    ?? agent?.phones?.[0]?.number;

  const rawType = (prop.description?.type ?? "").toLowerCase();
  const isResidential = RESIDENTIAL_PROP_TYPES.has(rawType);
  const propType = prop.description?.type ?? "Commercial";
  const listingType = "sale";

  const buildingSf = prop.description?.sqft ?? undefined;

  const lotAcres = prop.description?.lot_sqft
    ? prop.description.lot_sqft / 43560
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
    yearBuilt: prop.description?.year_built ?? undefined,
    priceAmount: prop.list_price ?? undefined,
    priceUnit: "total",
    brokerName: agent?.name,
    brokerCompany: agent?.office?.name,
    brokerPhone: phone,
    brokerEmail: agent?.email,
    description: prop.description?.text,
    imageUrl: prop.photos?.[0]?.href,
    sourceUrl: prop.href,
    rawData: prop as Record<string, unknown>,
    // Residential fields
    beds: prop.description?.beds,
    baths: prop.description?.baths,
    garageSpaces: prop.description?.garage ?? undefined,
    stories: prop.description?.stories,
    propSubType: mapPropSubType(prop.description?.type),
    searchMode: isResidential ? "residential" : "commercial",
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
