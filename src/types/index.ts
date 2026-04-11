export type Market = "austin" | "dfw";

export type SearchMode = "commercial" | "residential";

export type PropertyType =
  | "Office"
  | "Retail"
  | "Industrial"
  | "Multifamily"
  | "Land"
  | "Mixed Use"
  | "Hospitality"
  | "Special Purpose";

export type ResidentialPropertySubType =
  | "Single Family"
  | "Condo"
  | "Townhouse"
  | "Multi-Family"
  | "Mobile/Manufactured"
  | "Land"
  | "Farm/Ranch";

export type ListingType = "Sale" | "Lease" | "Sublease";

export type PriceUnit = "total" | "per_sf" | "per_sf_yr" | "per_sf_mo";

export interface ListingFilters {
  market?: Market;
  searchMode?: SearchMode;
  propertyType?: PropertyType[];
  listingType?: ListingType[];
  priceMin?: number;
  priceMax?: number;
  sfMin?: number;
  sfMax?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  status?: string;
  brokerCompany?: string;
  query?: string; // address/city/zip text search
  sources?: string[]; // source slugs to filter by
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  // Residential filters
  bedsMin?: number;
  bedsMax?: number;
  bathsMin?: number;
  bathsMax?: number;
  propSubType?: ResidentialPropertySubType[];
  garageMin?: number;
  lotAcresMin?: number;
  lotAcresMax?: number;
  storiesMin?: number;
  // Special features
  hasPool?: boolean;
  hasWaterfront?: boolean;
  hasView?: boolean;
  hasGuestAccommodations?: boolean;
  hasBoatSlip?: boolean;
}

export interface ListingWithVariants {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  lat: number;
  lng: number;
  market: string;
  propertyType: string;
  listingType: string;
  buildingSf: number | null;
  lotSizeAcres: number | null;
  priceAmount: number | null;
  priceUnit: string | null;
  yearBuilt: number | null;
  brokerName: string | null;
  brokerCompany: string | null;
  description: string | null;
  imageUrl: string | null;
  status: string;
  beds: number | null;
  baths: number | null;
  garageSpaces: number | null;
  stories: number | null;
  propSubType: string | null;
  searchMode: string;
  createdAt: string;
  updatedAt: string;
  variants: ListingVariantData[];
  isFavorited?: boolean;
}

export interface ListingVariantData {
  id: string;
  sourceName: string;
  sourceSlug: string;
  externalId: string;
  sourceUrl: string | null;
  priceAmount: number | null;
  priceUnit: string | null;
  buildingSf: number | null;
  description: string | null;
  brokerName: string | null;
  brokerPhone: string | null;
  brokerEmail: string | null;
  imageUrl: string | null;
  fetchedAt: string;
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    id: string;
    address: string;
    city: string;
    propertyType: string;
    listingType: string;
    priceAmount: number | null;
    priceUnit: string | null;
    buildingSf: number | null;
    status: string;
    beds: number | null;
    baths: number | null;
    propSubType: string | null;
    searchMode: string;
  };
}
