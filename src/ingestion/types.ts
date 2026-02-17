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
}

export interface ListingProvider {
  slug: string;
  name: string;
  fetchListings(market: "austin" | "dfw"): Promise<NormalizedListing[]>;
}
