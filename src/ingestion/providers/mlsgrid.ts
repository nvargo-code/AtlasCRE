/**
 * MLS Grid Provider — Replicates listings from Unlock MLS (formerly ACTRIS)
 * via the MLS Grid OData v2.0 API.
 *
 * This provider fetches Property records with Media, Rooms, and UnitTypes
 * expanded, normalizes them to our NormalizedListing format, and handles
 * pagination via @odata.nextLink.
 *
 * API Docs: https://docs.mlsgrid.com/api-documentation/api-version-2.0
 *
 * Rate limits: 2 req/sec, 7200 req/hour, 40K req/day, 4GB/hour
 */

import type { NormalizedListing } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MlsGridMedia {
  MediaKey: string;
  MediaURL: string;
  MediaModificationTimestamp?: string;
  Order?: number;
  MediaCategory?: string;
  ShortDescription?: string;
}

interface MlsGridRoom {
  RoomKey: string;
  RoomType?: string;
  RoomDimensions?: string;
  RoomFeatures?: string;
}

interface MlsGridProperty {
  // Identifiers
  ListingKey: string;
  ListingId: string;
  OriginatingSystemName: string;

  // Status & Type
  StandardStatus: string;
  MlsStatus?: string;
  PropertyType: string;
  PropertySubType?: string;

  // Location
  UnparsedAddress?: string;
  StreetNumber?: string;
  StreetName?: string;
  StreetSuffix?: string;
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  CountyOrParish?: string;
  Latitude?: number;
  Longitude?: number;
  Directions?: string;
  MLSAreaMajor?: string;
  SubdivisionName?: string;

  // Price
  ListPrice?: number;
  OriginalListPrice?: number;
  PreviousListPrice?: number;

  // Property Details
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  BathroomsFull?: number;
  BathroomsHalf?: number;
  LivingArea?: number;
  LotSizeAcres?: number;
  LotSizeSquareFeet?: number;
  YearBuilt?: number;
  GarageSpaces?: number;
  CoveredSpaces?: number;
  ParkingTotal?: number;
  FireplacesTotal?: number;
  StoriesTotal?: number;
  Levels?: string[];

  // Building/Commercial
  BuildingAreaTotal?: number;

  // Listing info
  ListingContractDate?: string;
  OriginalEntryTimestamp?: string;
  ModificationTimestamp: string;
  PhotosChangeTimestamp?: string;
  PhotosCount?: number;

  // Broker/Agent
  ListAgentFullName?: string;
  ListAgentEmail?: string;
  ListAgentDirectPhone?: string;
  ListAgentMlsId?: string;
  ListOfficeName?: string;
  ListOfficeMlsId?: string;
  ListOfficePhone?: string;

  // Buyer side
  BuyerAgencyCompensation?: string;
  BuyerAgencyCompensationType?: string;

  // Description
  PublicRemarks?: string;
  SyndicationRemarks?: string;
  VirtualTourURLUnbranded?: string;

  // Construction & Features
  ConstructionMaterials?: string[];
  ArchitecturalStyle?: string[];
  Roof?: string[];
  Flooring?: string[];
  Heating?: string[];
  Cooling?: string[];
  InteriorFeatures?: string[];
  ExteriorFeatures?: string[];
  Appliances?: string[];
  WaterSource?: string[];
  Sewer?: string[];
  Utilities?: string[];
  Fencing?: string[];
  PoolFeatures?: string[];
  PoolPrivateYN?: boolean;
  View?: string[];
  LotFeatures?: string[];

  // Schools
  ElementarySchool?: string;
  MiddleOrJuniorSchool?: string;
  HighSchool?: string;

  // Tax
  TaxAssessedValue?: number;
  TaxYear?: number;
  TaxLegalDescription?: string;
  ParcelNumber?: string;

  // Association/HOA
  AssociationYN?: boolean;
  AssociationFee?: number;
  AssociationFeeFrequency?: string;

  // MLS Grid specific
  MlgCanView: boolean;
  MlgCanUse?: string[];

  // Media (expanded)
  Media?: MlsGridMedia[];
  Rooms?: MlsGridRoom[];

  // Local ACTRIS-specific fields (prefixed with ACT_)
  [key: string]: unknown;
}

interface MlsGridResponse {
  "@odata.context"?: string;
  "@odata.nextLink"?: string;
  value: MlsGridProperty[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = "https://api.mlsgrid.com/v2";
const ORIGINATING_SYSTEM = "actris"; // Unlock MLS (formerly ACTRIS)

// Records per page (max 5000 without expand, 1000 with expand)
const PAGE_SIZE = 500;

// Delay between requests to stay under 2 req/sec limit
const REQUEST_DELAY_MS = 600;

// Max pages per run to avoid hitting rate limits (can increase later)
const MAX_PAGES = 100;

// Property types we consider residential
const RESIDENTIAL_TYPES = new Set([
  "Residential",
  "Residential Income",
  "Residential Lease",
  "Manufactured In Park",
]);

// Property types we consider commercial
const COMMERCIAL_TYPES = new Set([
  "Commercial Sale",
  "Commercial Lease",
  "Business Opportunity",
  "Land",
  "Farm",
]);

// Market mapping based on county/area
const AUSTIN_AREAS = new Set([
  "Travis",
  "Williamson",
  "Hays",
  "Bastrop",
  "Caldwell",
  "Burnet",
  "Lee",
  "Llano",
  "Blanco",
  "Fayette",
  "Gonzales",
  "Guadalupe",
  "Comal",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiToken(): string {
  const token = process.env.MLSGRID_API_TOKEN;
  if (!token) {
    throw new Error(
      "MLSGRID_API_TOKEN environment variable is required. " +
        "Get your token from MLS Grid: Manage Subscriptions → Edit Subscription → Token tab"
    );
  }
  return token;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Strip the MLS-specific prefix from key/ID fields.
 * e.g., "ACT107472571" → "107472571"
 */
function stripPrefix(value: string): string {
  return value.replace(/^[A-Z]{2,4}/, "");
}

/**
 * Build a full street address from components.
 */
function buildAddress(p: MlsGridProperty): string {
  if (p.UnparsedAddress?.trim()) {
    return p.UnparsedAddress.trim();
  }
  const parts = [p.StreetNumber, p.StreetName, p.StreetSuffix].filter(Boolean);
  return parts.join(" ").trim() || "";
}

/**
 * Determine if the listing is in the Austin or DFW market.
 */
function detectMarket(p: MlsGridProperty): "austin" | "dfw" {
  const county = p.CountyOrParish?.trim() || "";
  if (AUSTIN_AREAS.has(county)) return "austin";
  // Default to Austin since ACTRIS primarily covers Austin area
  return "austin";
}

/**
 * Determine search mode (residential vs commercial).
 */
function detectSearchMode(
  propertyType: string
): "residential" | "commercial" {
  if (RESIDENTIAL_TYPES.has(propertyType)) return "residential";
  if (COMMERCIAL_TYPES.has(propertyType)) return "commercial";
  // Default to residential for unknown types
  return "residential";
}

/**
 * Map MLS Grid PropertySubType to our simplified subtype.
 */
function mapPropertySubType(subType?: string): string | undefined {
  if (!subType) return undefined;
  const mapping: Record<string, string> = {
    "Single Family Residence": "Single Family",
    Condominium: "Condo",
    Townhouse: "Townhouse",
    "Manufactured Home": "Manufactured",
    "Mobile Home": "Mobile Home",
    Duplex: "Multi-Family",
    Triplex: "Multi-Family",
    Quadruplex: "Multi-Family",
    "Ranch/Farm": "Farm/Ranch",
    "Lots/Land": "Land",
  };
  return mapping[subType] || subType;
}

/**
 * Get the primary photo URL from the media array.
 * Media should be downloaded and cached — MLS Grid URLs are for download only.
 */
function getPrimaryPhotoUrl(media?: MlsGridMedia[]): string | undefined {
  if (!media || media.length === 0) return undefined;

  // Sort by Order if available, take first
  const sorted = [...media].sort((a, b) => (a.Order ?? 0) - (b.Order ?? 0));

  // Find a Photo type first, fallback to any media
  const photo = sorted.find(
    (m) => !m.MediaCategory || m.MediaCategory === "Photo"
  );
  return (photo || sorted[0])?.MediaURL;
}

/**
 * Get all photo URLs from the media array.
 */
function getAllPhotoUrls(media?: MlsGridMedia[]): string[] {
  if (!media || media.length === 0) return [];
  return [...media]
    .filter((m) => !m.MediaCategory || m.MediaCategory === "Photo")
    .sort((a, b) => (a.Order ?? 0) - (b.Order ?? 0))
    .map((m) => m.MediaURL)
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizeProperty(p: MlsGridProperty): NormalizedListing | null {
  // Skip records that should not be in the feed
  if (!p.MlgCanView) return null;

  // Must have usable address and location
  const address = buildAddress(p);
  if (!address || !p.City || p.Latitude == null || p.Longitude == null) {
    return null;
  }

  // Only include active/pending/coming soon listings
  const status = p.StandardStatus?.toLowerCase() || "";
  const activeStatuses = [
    "active",
    "active under contract",
    "pending",
    "coming soon",
  ];
  if (!activeStatuses.includes(status)) return null;

  const searchMode = detectSearchMode(p.PropertyType || "Residential");
  const market = detectMarket(p);

  const listing: NormalizedListing = {
    externalId: p.ListingKey,
    sourceSlug: "mlsgrid",

    // Location
    address,
    city: p.City,
    state: p.StateOrProvince || "TX",
    zip: p.PostalCode || "",
    lat: p.Latitude,
    lng: p.Longitude,
    market,

    // Property info
    propertyType: p.PropertyType || "Residential",
    listingType:
      p.PropertyType?.includes("Lease") ? "For Lease" : "For Sale",
    buildingSf: p.LivingArea || p.BuildingAreaTotal || undefined,
    lotSizeAcres:
      p.LotSizeAcres ||
      (p.LotSizeSquareFeet ? p.LotSizeSquareFeet / 43560 : undefined),
    yearBuilt: p.YearBuilt || undefined,

    // Price
    priceAmount: p.ListPrice || undefined,
    priceUnit: p.ListPrice ? "total" : undefined,

    // Broker
    brokerName: p.ListAgentFullName || undefined,
    brokerCompany: p.ListOfficeName || undefined,
    brokerPhone: p.ListAgentDirectPhone || p.ListOfficePhone || undefined,
    brokerEmail: p.ListAgentEmail || undefined,

    // Content
    description: p.PublicRemarks || p.SyndicationRemarks || undefined,
    imageUrl: getPrimaryPhotoUrl(p.Media),
    sourceUrl: undefined, // MLS Grid doesn't provide listing URLs

    // Residential fields
    beds: p.BedroomsTotal || undefined,
    baths: p.BathroomsTotalInteger || undefined,
    garageSpaces: p.GarageSpaces || undefined,
    stories:
      p.StoriesTotal ||
      (p.Levels?.length === 1 && p.Levels[0] === "One" ? 1 : undefined),
    propSubType: mapPropertySubType(p.PropertySubType),
    searchMode,

    // Special features
    constructionMaterials: p.ConstructionMaterials?.join(", ") || undefined,
    hasPool: p.PoolPrivateYN === true || (p.PoolFeatures && p.PoolFeatures.length > 0) || undefined,
    hasWaterfront: p.LotFeatures?.some((f) => /waterfront|lake\s*front|river\s*front|creek/i.test(f))
      || p.View?.some((v) => /water|lake|river|ocean/i.test(v)) || undefined,
    hasView: (p.View && p.View.length > 0) || undefined,
    hasGuestAccommodations: p.InteriorFeatures?.some((f) => /guest|mother.in.law|in.law|adu|casita/i.test(f))
      || (p.PublicRemarks && /guest\s*(house|suite|quarters|accommodations)|mother.in.law|casita|ADU/i.test(p.PublicRemarks)) || undefined,
    hasBoatSlip: p.LotFeatures?.some((f) => /boat\s*slip|boat\s*dock|marina/i.test(f))
      || (p.PublicRemarks && /boat\s*(slip|dock)|marina/i.test(p.PublicRemarks)) || undefined,

    // Store full raw data for future use
    rawData: {
      listingKey: p.ListingKey,
      listingId: stripPrefix(p.ListingId),
      standardStatus: p.StandardStatus,
      mlsStatus: p.MlsStatus,
      propertySubType: p.PropertySubType,
      county: p.CountyOrParish,
      subdivision: p.SubdivisionName,
      area: p.MLSAreaMajor,
      originalListPrice: p.OriginalListPrice,
      previousListPrice: p.PreviousListPrice,
      listingContractDate: p.ListingContractDate,
      originalEntryTimestamp: p.OriginalEntryTimestamp,
      modificationTimestamp: p.ModificationTimestamp,
      photosCount: p.PhotosCount,
      photoUrls: getAllPhotoUrls(p.Media),
      virtualTourUrl: p.VirtualTourURLUnbranded,
      // Tax
      taxAssessedValue: p.TaxAssessedValue,
      taxYear: p.TaxYear,
      parcelNumber: p.ParcelNumber,
      // Schools
      elementarySchool: p.ElementarySchool,
      middleSchool: p.MiddleOrJuniorSchool,
      highSchool: p.HighSchool,
      // HOA
      hasHoa: p.AssociationYN,
      hoaFee: p.AssociationFee,
      hoaFrequency: p.AssociationFeeFrequency,
      // Buyer compensation
      buyerCompensation: p.BuyerAgencyCompensation,
      buyerCompensationType: p.BuyerAgencyCompensationType,
      // Features (stored for future search/filter)
      constructionMaterials: p.ConstructionMaterials,
      architecturalStyle: p.ArchitecturalStyle,
      roof: p.Roof,
      flooring: p.Flooring,
      heating: p.Heating,
      cooling: p.Cooling,
      interiorFeatures: p.InteriorFeatures,
      exteriorFeatures: p.ExteriorFeatures,
      appliances: p.Appliances,
      fencing: p.Fencing,
      poolFeatures: p.PoolFeatures,
      hasPool: p.PoolPrivateYN,
      view: p.View,
      lotFeatures: p.LotFeatures,
      rooms:
        p.Rooms?.map((r) => ({
          type: r.RoomType,
          dimensions: r.RoomDimensions,
          features: r.RoomFeatures,
        })) || [],
      // Parking
      parkingTotal: p.ParkingTotal,
      coveredSpaces: p.CoveredSpaces,
      garageSpaces: p.GarageSpaces,
      // Agent IDs for future matching
      listAgentMlsId: p.ListAgentMlsId
        ? stripPrefix(p.ListAgentMlsId)
        : undefined,
      listOfficeMlsId: p.ListOfficeMlsId
        ? stripPrefix(p.ListOfficeMlsId)
        : undefined,
    },
  };

  return listing;
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

/**
 * Fetch a single page of property data from MLS Grid.
 */
async function fetchPage(
  url: string,
  token: string
): Promise<MlsGridResponse> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Accept-Encoding": "gzip",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `MLS Grid API error ${response.status}: ${response.statusText} — ${text}`
    );
  }

  return response.json() as Promise<MlsGridResponse>;
}

/**
 * Build the initial import URL for the MLS Grid API.
 * Fetches all active listings with media.
 */
function buildInitialUrl(options?: { lastModified?: string }): string {
  // Filter by originating system (required)
  let filter = `OriginatingSystemName eq '${ORIGINATING_SYSTEM}'`;

  if (options?.lastModified) {
    filter += ` and ModificationTimestamp gt ${options.lastModified}`;
  } else {
    filter += " and MlgCanView eq true";
  }

  // Only active listings
  filter += " and StandardStatus eq 'Active'";

  const url = new URL(`${API_BASE}/Property`);
  url.searchParams.set("$filter", filter);
  url.searchParams.set("$expand", "Media,Rooms");
  url.searchParams.set("$top", String(PAGE_SIZE));

  return url.toString();
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const mlsGridProvider = {
  slug: "mlsgrid",
  name: "MLS Grid (Unlock MLS / ACTRIS)",

  async fetchListings(market: string, options?: { postalCode?: string }): Promise<NormalizedListing[]> {
    console.log(
      `[MLSGrid] Starting fetch for market: ${market}${options?.postalCode ? ` zip: ${options.postalCode}` : ""}`
    );

    const token = getApiToken();
    const listings: NormalizedListing[] = [];

    const postalCode = options?.postalCode;
    let url: string | undefined = buildInitialUrl();
    let page = 0;

    while (url && page < MAX_PAGES) {
      try {
        console.log(
          `[MLSGrid] Fetching page ${page + 1}... ${url.substring(0, 120)}...`
        );
        const data = await fetchPage(url, token);

        if (!data.value || data.value.length === 0) {
          console.log("[MLSGrid] No more records.");
          break;
        }

        console.log(
          `[MLSGrid] Received ${data.value.length} records on page ${page + 1}`
        );

        for (const property of data.value) {
          // Filter by postal code if specified (API doesn't support this filter)
          if (postalCode && property.PostalCode !== postalCode) continue;

          const normalized = normalizeProperty(property);
          if (normalized) {
            if (normalized.market === market || market === "all") {
              listings.push(normalized);
            }
          }
        }

        // If filtering by zip and we have enough, stop early
        if (postalCode && listings.length > 0 && !data["@odata.nextLink"]) break;

        // Follow pagination link
        url = data["@odata.nextLink"];
        page++;

        // Rate limiting: stay under 2 req/sec
        if (url) {
          await sleep(REQUEST_DELAY_MS);
        }
      } catch (error) {
        console.error(
          `[MLSGrid] Error fetching page ${page + 1}:`,
          error instanceof Error ? error.message : error
        );
        // On error, stop pagination but return what we have
        break;
      }
    }

    if (page >= MAX_PAGES) {
      console.warn(
        `[MLSGrid] Hit max pages (${MAX_PAGES}). There may be more data.`
      );
    }

    console.log(
      `[MLSGrid] Fetch complete: ${listings.length} normalized listings for market "${market}"`
    );
    return listings;
  },
};

export default mlsGridProvider;
