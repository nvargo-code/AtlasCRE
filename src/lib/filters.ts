import { Prisma } from "@/generated/prisma/client";
import { ListingFilters } from "@/types";

export function buildListingWhere(filters: ListingFilters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {};

  // Residential-only platform — no searchMode filter needed

  if (filters.market) {
    where.market = filters.market;
  }

  if (filters.propertyType?.length) {
    where.propertyType = { in: filters.propertyType };
  }

  if (filters.listingType?.length) {
    where.listingType = { in: filters.listingType };
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.priceAmount = {};
    if (filters.priceMin !== undefined) where.priceAmount.gte = filters.priceMin;
    if (filters.priceMax !== undefined) where.priceAmount.lte = filters.priceMax;
  }

  if (filters.sfMin !== undefined || filters.sfMax !== undefined) {
    where.buildingSf = {};
    if (filters.sfMin !== undefined) where.buildingSf.gte = filters.sfMin;
    if (filters.sfMax !== undefined) where.buildingSf.lte = filters.sfMax;
  }

  if (filters.yearBuiltMin !== undefined || filters.yearBuiltMax !== undefined) {
    where.yearBuilt = {};
    if (filters.yearBuiltMin !== undefined) where.yearBuilt.gte = filters.yearBuiltMin;
    if (filters.yearBuiltMax !== undefined) where.yearBuilt.lte = filters.yearBuiltMax;
  }

  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = "active";
  }

  if (filters.brokerCompany) {
    where.brokerCompany = { contains: filters.brokerCompany, mode: "insensitive" };
  }

  if (filters.query) {
    where.OR = [
      { address: { contains: filters.query, mode: "insensitive" } },
      { city: { contains: filters.query, mode: "insensitive" } },
      { zip: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  if (filters.sources?.length) {
    where.variants = {
      some: {
        source: { slug: { in: filters.sources } },
      },
    };
  }

  if (filters.bedsMin !== undefined || filters.bedsMax !== undefined) {
    where.beds = {};
    if (filters.bedsMin !== undefined) where.beds.gte = filters.bedsMin;
    if (filters.bedsMax !== undefined) where.beds.lte = filters.bedsMax;
  }

  if (filters.bathsMin !== undefined || filters.bathsMax !== undefined) {
    where.baths = {};
    if (filters.bathsMin !== undefined) where.baths.gte = filters.bathsMin;
    if (filters.bathsMax !== undefined) where.baths.lte = filters.bathsMax;
  }

  if (filters.propSubType?.length) {
    where.propSubType = { in: filters.propSubType };
  }

  if (filters.bounds) {
    where.lat = { gte: filters.bounds.south, lte: filters.bounds.north };
    where.lng = { gte: filters.bounds.west, lte: filters.bounds.east };
  }

  return where;
}

export function parseFiltersFromParams(params: URLSearchParams): ListingFilters {
  const filters: ListingFilters = {};

  const searchMode = params.get("searchMode");
  if (searchMode === "commercial" || searchMode === "residential") filters.searchMode = searchMode;

  const market = params.get("market");
  if (market === "austin" || market === "dfw") filters.market = market;

  const propertyType = params.get("propertyType");
  if (propertyType) filters.propertyType = propertyType.split(",") as ListingFilters["propertyType"];

  const listingType = params.get("listingType");
  if (listingType) filters.listingType = listingType.split(",") as ListingFilters["listingType"];

  const priceMin = params.get("priceMin");
  if (priceMin) filters.priceMin = Number(priceMin);

  const priceMax = params.get("priceMax");
  if (priceMax) filters.priceMax = Number(priceMax);

  const sfMin = params.get("sfMin");
  if (sfMin) filters.sfMin = Number(sfMin);

  const sfMax = params.get("sfMax");
  if (sfMax) filters.sfMax = Number(sfMax);

  const yearBuiltMin = params.get("yearBuiltMin");
  if (yearBuiltMin) filters.yearBuiltMin = Number(yearBuiltMin);

  const yearBuiltMax = params.get("yearBuiltMax");
  if (yearBuiltMax) filters.yearBuiltMax = Number(yearBuiltMax);

  const status = params.get("status");
  if (status) filters.status = status;

  const brokerCompany = params.get("brokerCompany");
  if (brokerCompany) filters.brokerCompany = brokerCompany;

  const query = params.get("q");
  if (query) filters.query = query;

  const bedsMin = params.get("bedsMin");
  if (bedsMin) filters.bedsMin = Number(bedsMin);
  const bedsMax = params.get("bedsMax");
  if (bedsMax) filters.bedsMax = Number(bedsMax);

  const bathsMin = params.get("bathsMin");
  if (bathsMin) filters.bathsMin = Number(bathsMin);
  const bathsMax = params.get("bathsMax");
  if (bathsMax) filters.bathsMax = Number(bathsMax);

  const propSubType = params.get("propSubType");
  if (propSubType) filters.propSubType = propSubType.split(",") as ListingFilters["propSubType"];

  const sources = params.get("sources");
  if (sources) filters.sources = sources.split(",");

  const north = params.get("north");
  const south = params.get("south");
  const east = params.get("east");
  const west = params.get("west");
  if (north && south && east && west) {
    filters.bounds = {
      north: Number(north),
      south: Number(south),
      east: Number(east),
      west: Number(west),
    };
  }

  return filters;
}
