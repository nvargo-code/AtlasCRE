-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'CLIENT';
ALTER TYPE "Role" ADD VALUE 'AGENT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "ProcessedEmail" (
    "id" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "threadId" TEXT,
    "from" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPocketListing" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keywords" TEXT[],
    "mlsNumber" TEXT,
    "listingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "errorMessage" TEXT,
    "rawBody" TEXT,
    "extractedData" JSONB,

    CONSTRAINT "ProcessedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPhoto" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentClient" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stage" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "priceMin" DOUBLE PRECISION,
    "priceMax" DOUBLE PRECISION,
    "targetAreas" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionMember" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionListing" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionReaction" (
    "id" TEXT NOT NULL,
    "collectionListingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionComment" (
    "id" TEXT NOT NULL,
    "collectionListingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageThread" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "subject" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadParticipant" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastRead" TIMESTAMP(3),

    CONSTRAINT "ThreadParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowingRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT,
    "listingId" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "preferredTime" TEXT,
    "alternateDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'requested',
    "rating" INTEGER,
    "feedback" TEXT,
    "wouldOffer" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "listingId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotScore" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "signals" JSONB NOT NULL,
    "reasoning" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "changeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedEmail_gmailMessageId_key" ON "ProcessedEmail"("gmailMessageId");

-- CreateIndex
CREATE INDEX "ProcessedEmail_gmailMessageId_idx" ON "ProcessedEmail"("gmailMessageId");

-- CreateIndex
CREATE INDEX "ProcessedEmail_processedAt_idx" ON "ProcessedEmail"("processedAt");

-- CreateIndex
CREATE INDEX "ProcessedEmail_isPocketListing_idx" ON "ProcessedEmail"("isPocketListing");

-- CreateIndex
CREATE INDEX "ListingPhoto_listingId_idx" ON "ListingPhoto"("listingId");

-- CreateIndex
CREATE INDEX "AgentClient_agentId_idx" ON "AgentClient"("agentId");

-- CreateIndex
CREATE INDEX "AgentClient_clientId_idx" ON "AgentClient"("clientId");

-- CreateIndex
CREATE INDEX "AgentClient_stage_idx" ON "AgentClient"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "AgentClient_agentId_clientId_key" ON "AgentClient"("agentId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_shareToken_key" ON "Collection"("shareToken");

-- CreateIndex
CREATE INDEX "Collection_createdById_idx" ON "Collection"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionMember_collectionId_userId_key" ON "CollectionMember"("collectionId", "userId");

-- CreateIndex
CREATE INDEX "CollectionListing_collectionId_idx" ON "CollectionListing"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionListing_listingId_idx" ON "CollectionListing"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionListing_collectionId_listingId_key" ON "CollectionListing"("collectionId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionReaction_collectionListingId_userId_key" ON "CollectionReaction"("collectionListingId", "userId");

-- CreateIndex
CREATE INDEX "CollectionComment_collectionListingId_idx" ON "CollectionComment"("collectionListingId");

-- CreateIndex
CREATE INDEX "MessageThread_listingId_idx" ON "MessageThread"("listingId");

-- CreateIndex
CREATE INDEX "MessageThread_lastMessageAt_idx" ON "MessageThread"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadParticipant_threadId_userId_key" ON "ThreadParticipant"("threadId", "userId");

-- CreateIndex
CREATE INDEX "Message_threadId_idx" ON "Message"("threadId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "ShowingRequest_clientId_idx" ON "ShowingRequest"("clientId");

-- CreateIndex
CREATE INDEX "ShowingRequest_agentId_idx" ON "ShowingRequest"("agentId");

-- CreateIndex
CREATE INDEX "ShowingRequest_listingId_idx" ON "ShowingRequest"("listingId");

-- CreateIndex
CREATE INDEX "ShowingRequest_status_idx" ON "ShowingRequest"("status");

-- CreateIndex
CREATE INDEX "ListingActivity_userId_idx" ON "ListingActivity"("userId");

-- CreateIndex
CREATE INDEX "ListingActivity_listingId_idx" ON "ListingActivity"("listingId");

-- CreateIndex
CREATE INDEX "ListingActivity_action_idx" ON "ListingActivity"("action");

-- CreateIndex
CREATE INDEX "ListingActivity_createdAt_idx" ON "ListingActivity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HotScore_listingId_key" ON "HotScore"("listingId");

-- CreateIndex
CREATE INDEX "HotScore_score_idx" ON "HotScore"("score");

-- CreateIndex
CREATE INDEX "PriceHistory_listingId_idx" ON "PriceHistory"("listingId");

-- CreateIndex
CREATE INDEX "PriceHistory_changeDate_idx" ON "PriceHistory"("changeDate");

-- AddForeignKey
ALTER TABLE "ProcessedEmail" ADD CONSTRAINT "ProcessedEmail_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPhoto" ADD CONSTRAINT "ListingPhoto_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentClient" ADD CONSTRAINT "AgentClient_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentClient" ADD CONSTRAINT "AgentClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMember" ADD CONSTRAINT "CollectionMember_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMember" ADD CONSTRAINT "CollectionMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionListing" ADD CONSTRAINT "CollectionListing_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionListing" ADD CONSTRAINT "CollectionListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionListing" ADD CONSTRAINT "CollectionListing_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionReaction" ADD CONSTRAINT "CollectionReaction_collectionListingId_fkey" FOREIGN KEY ("collectionListingId") REFERENCES "CollectionListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionReaction" ADD CONSTRAINT "CollectionReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionComment" ADD CONSTRAINT "CollectionComment_collectionListingId_fkey" FOREIGN KEY ("collectionListingId") REFERENCES "CollectionListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionComment" ADD CONSTRAINT "CollectionComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadParticipant" ADD CONSTRAINT "ThreadParticipant_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadParticipant" ADD CONSTRAINT "ThreadParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowingRequest" ADD CONSTRAINT "ShowingRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowingRequest" ADD CONSTRAINT "ShowingRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowingRequest" ADD CONSTRAINT "ShowingRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingActivity" ADD CONSTRAINT "ListingActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingActivity" ADD CONSTRAINT "ListingActivity_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotScore" ADD CONSTRAINT "HotScore_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
