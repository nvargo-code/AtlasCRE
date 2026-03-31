-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "baths" DOUBLE PRECISION,
ADD COLUMN     "beds" INTEGER,
ADD COLUMN     "garageSpaces" INTEGER,
ADD COLUMN     "propSubType" TEXT,
ADD COLUMN     "searchMode" TEXT NOT NULL DEFAULT 'commercial',
ADD COLUMN     "stories" INTEGER;

-- CreateIndex
CREATE INDEX "Listing_searchMode_idx" ON "Listing"("searchMode");
