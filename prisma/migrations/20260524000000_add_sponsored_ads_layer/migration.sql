-- CreateEnum
CREATE TYPE "AdType" AS ENUM ('sponsored_provider_pin', 'sponsored_provider_card', 'local_campaign_banner', 'sponsored_event', 'sponsored_marketplace_listing', 'sponsored_service_zone');

-- CreateEnum
CREATE TYPE "AdCampaignStatus" AS ENUM ('draft', 'pending_review', 'approved', 'active', 'paused', 'rejected', 'suspended', 'ended');

-- CreateEnum
CREATE TYPE "AdReviewDecision" AS ENUM ('pending', 'approved', 'rejected', 'changes_requested');

-- CreateEnum
CREATE TYPE "AdEventType" AS ENUM ('impression', 'click', 'map_pin_opened', 'cta_clicked', 'booking_started', 'booking_completed', 'dismissed', 'reported');

-- CreateEnum
CREATE TYPE "AdBudgetEventType" AS ENUM ('spend', 'refund', 'adjustment');

-- CreateEnum
CREATE TYPE "AdTargetingRuleKind" AS ENUM ('service_category', 'suburb_postcode', 'map_viewport', 'access_feature', 'provider_finder_context', 'event_category');

-- CreateEnum
CREATE TYPE "AdPlacementSurface" AS ENUM ('map', 'provider_finder', 'marketplace', 'events');

-- CreateTable
CREATE TABLE "advertiser_profiles" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertiser_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_campaigns" (
    "id" TEXT NOT NULL,
    "advertiserProfileId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adType" "AdType" NOT NULL,
    "status" "AdCampaignStatus" NOT NULL DEFAULT 'draft',
    "reviewStatus" "AdReviewDecision" NOT NULL DEFAULT 'pending',
    "dailyBudgetCents" INTEGER NOT NULL DEFAULT 0,
    "totalBudgetCents" INTEGER NOT NULL DEFAULT 0,
    "spentBudgetCents" INTEGER NOT NULL DEFAULT 0,
    "bidAmountCents" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_creatives" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "providerProfileId" TEXT,
    "providerOutletKey" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_creatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_targeting_rules" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "ruleKind" "AdTargetingRuleKind" NOT NULL,
    "ruleValue" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_targeting_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_events" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creativeId" TEXT,
    "eventType" "AdEventType" NOT NULL,
    "placementSurface" "AdPlacementSurface",
    "sessionToken" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_budget_events" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "eventType" "AdBudgetEventType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_budget_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_review_events" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "AdReviewDecision" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_review_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_user_actions" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "sessionToken" TEXT,
    "userId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_user_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "advertiser_profiles_organisationId_key" ON "advertiser_profiles"("organisationId");

-- CreateIndex
CREATE INDEX "advertiser_profiles_ownerUserId_idx" ON "advertiser_profiles"("ownerUserId");

-- CreateIndex
CREATE INDEX "ad_campaigns_organisationId_status_idx" ON "ad_campaigns"("organisationId", "status");

-- CreateIndex
CREATE INDEX "ad_campaigns_adType_status_reviewStatus_idx" ON "ad_campaigns"("adType", "status", "reviewStatus");

-- CreateIndex
CREATE INDEX "ad_creatives_campaignId_idx" ON "ad_creatives"("campaignId");

-- CreateIndex
CREATE INDEX "ad_targeting_rules_campaignId_idx" ON "ad_targeting_rules"("campaignId");

-- CreateIndex
CREATE INDEX "ad_events_campaignId_eventType_createdAt_idx" ON "ad_events"("campaignId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "ad_events_sessionToken_idx" ON "ad_events"("sessionToken");

-- CreateIndex
CREATE INDEX "ad_budget_events_campaignId_createdAt_idx" ON "ad_budget_events"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "ad_review_events_campaignId_createdAt_idx" ON "ad_review_events"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "ad_user_actions_campaignId_actionType_idx" ON "ad_user_actions"("campaignId", "actionType");

-- CreateIndex
CREATE INDEX "ad_user_actions_sessionToken_userId_idx" ON "ad_user_actions"("sessionToken", "userId");

-- AddForeignKey
ALTER TABLE "advertiser_profiles" ADD CONSTRAINT "advertiser_profiles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertiser_profiles" ADD CONSTRAINT "advertiser_profiles_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_advertiserProfileId_fkey" FOREIGN KEY ("advertiserProfileId") REFERENCES "advertiser_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_targeting_rules" ADD CONSTRAINT "ad_targeting_rules_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_events" ADD CONSTRAINT "ad_events_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_budget_events" ADD CONSTRAINT "ad_budget_events_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_review_events" ADD CONSTRAINT "ad_review_events_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_review_events" ADD CONSTRAINT "ad_review_events_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_user_actions" ADD CONSTRAINT "ad_user_actions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_user_actions" ADD CONSTRAINT "ad_user_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
