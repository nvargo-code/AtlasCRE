-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "baseUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,

    CONSTRAINT "ListingSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawListing" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'TX',
    "zip" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "market" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "listingType" TEXT NOT NULL,
    "buildingSf" DOUBLE PRECISION,
    "lotSizeAcres" DOUBLE PRECISION,
    "priceAmount" DOUBLE PRECISION,
    "priceUnit" TEXT,
    "yearBuilt" INTEGER,
    "brokerName" TEXT,
    "brokerCompany" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingVariant" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "priceAmount" DOUBLE PRECISION,
    "priceUnit" TEXT,
    "buildingSf" DOUBLE PRECISION,
    "description" TEXT,
    "brokerName" TEXT,
    "brokerPhone" TEXT,
    "brokerEmail" TEXT,
    "imageUrl" TEXT,
    "rawData" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ListingSource_name_key" ON "ListingSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ListingSource_slug_key" ON "ListingSource"("slug");

-- CreateIndex
CREATE INDEX "RawListing_market_idx" ON "RawListing"("market");

-- CreateIndex
CREATE UNIQUE INDEX "RawListing_sourceId_externalId_key" ON "RawListing"("sourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_dedupeKey_key" ON "Listing"("dedupeKey");

-- CreateIndex
CREATE INDEX "Listing_market_idx" ON "Listing"("market");

-- CreateIndex
CREATE INDEX "Listing_propertyType_idx" ON "Listing"("propertyType");

-- CreateIndex
CREATE INDEX "Listing_listingType_idx" ON "Listing"("listingType");

-- CreateIndex
CREATE INDEX "Listing_lat_lng_idx" ON "Listing"("lat", "lng");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "ListingVariant_listingId_idx" ON "ListingVariant"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingVariant_sourceId_externalId_key" ON "ListingVariant"("sourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteListing_userId_listingId_key" ON "FavoriteListing"("userId", "listingId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawListing" ADD CONSTRAINT "RawListing_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ListingSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingVariant" ADD CONSTRAINT "ListingVariant_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingVariant" ADD CONSTRAINT "ListingVariant_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ListingSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteListing" ADD CONSTRAINT "FavoriteListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteListing" ADD CONSTRAINT "FavoriteListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
