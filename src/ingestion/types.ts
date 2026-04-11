export interface NormalizedListing {
  externalId: string;
  sourceSlug: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  lat: number;
  lng: number;
  market: "austin" | "dfw";
  propertyType: string;
  listingType: string;
  buildingSf?: number;
  lotSizeAcres?: number;
  priceAmount?: number;
  priceUnit?: string;
  yearBuilt?: number;
  brokerName?: string;
  brokerCompany?: string;
  brokerPhone?: string;
  brokerEmail?: string;
  description?: string;
  imageUrl?: string;
  sourceUrl?: string;
  rawData: Record<string, unknown>;
  // Residential fields
  beds?: number;
  baths?: number;
  garageSpaces?: number;
  stories?: number;
  propSubType?: string;
  searchMode?: "commercial" | "residential";
  constructionMaterials?: string;
  hasPool?: boolean;
  hasWaterfront?: boolean;
  hasView?: boolean;
  hasGuestAccommodations?: boolean;
  hasBoatSlip?: boolean;
}

export interface FetchOptions {
  postalCode?: string;
}

export interface ListingProvider {
  slug: string;
  name: string;
  fetchListings(market: "austin" | "dfw", options?: FetchOptions): Promise<NormalizedListing[]>;
}
