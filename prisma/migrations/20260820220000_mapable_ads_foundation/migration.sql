-- MapAble Ads foundation (additive). Does not alter accessibility or provider ranking tables.

CREATE TYPE "AdEntityStatus" AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'ACTIVE',
  'PAUSED',
  'ENDED',
  'REJECTED',
  'DISABLED'
);

CREATE TYPE "AdProviderKind" AS ENUM (
  'mapable_internal',
  'google_ad_manager',
  'ethicalads'
);

CREATE TYPE "AdDecisionOutcome" AS ENUM (
  'FILL_INTERNAL',
  'FILL_EXTERNAL',
  'NO_FILL',
  'BLOCKED'
);

CREATE TABLE "ad_advertisers" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "name" TEXT NOT NULL,
  "status" "AdEntityStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_advertisers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_campaigns" (
  "id" TEXT NOT NULL,
  "advertiserId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "AdEntityStatus" NOT NULL DEFAULT 'DRAFT',
  "startAt" TIMESTAMP(3),
  "endAt" TIMESTAMP(3),
  "budgetType" TEXT,
  "budgetAmount" DECIMAL(12,2),
  "providerPreference" "AdProviderKind" NOT NULL DEFAULT 'mapable_internal',
  "priority" INTEGER NOT NULL DEFAULT 0,
  "isHouse" BOOLEAN NOT NULL DEFAULT false,
  "placementCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_creatives" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "headline" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "imageUrl" TEXT,
  "altText" TEXT,
  "destinationUrl" TEXT NOT NULL,
  "businessName" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "status" "AdEntityStatus" NOT NULL DEFAULT 'DRAFT',
  "claimFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_creatives_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_placements" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "surface" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "maxItems" INTEGER NOT NULL DEFAULT 1,
  "status" "AdEntityStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_placements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_placement_rules" (
  "id" TEXT NOT NULL,
  "placementId" TEXT NOT NULL,
  "ruleKey" TEXT NOT NULL,
  "ruleValue" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_placement_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_campaign_targets" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "region" TEXT,
  "category" TEXT,
  "geometry" JSONB,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_campaign_targets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_provider_configs" (
  "id" TEXT NOT NULL,
  "provider" "AdProviderKind" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "config" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_provider_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_decisions" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "placementCode" TEXT NOT NULL,
  "provider" "AdProviderKind",
  "campaignId" TEXT,
  "decision" "AdDecisionOutcome" NOT NULL,
  "reasonCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_impressions" (
  "id" TEXT NOT NULL,
  "decisionId" TEXT NOT NULL,
  "campaignId" TEXT,
  "placementCode" TEXT NOT NULL,
  "provider" "AdProviderKind" NOT NULL,
  "anonymousSessionRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_impressions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_clicks" (
  "id" TEXT NOT NULL,
  "impressionId" TEXT NOT NULL,
  "campaignId" TEXT,
  "provider" "AdProviderKind" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_clicks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_conversions" (
  "id" TEXT NOT NULL,
  "clickId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_conversions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_policy_reviews" (
  "id" TEXT NOT NULL,
  "creativeId" TEXT NOT NULL,
  "status" "AdEntityStatus" NOT NULL,
  "notes" TEXT,
  "reviewerId" TEXT,
  "claimFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_policy_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_placements_code_key" ON "ad_placements"("code");
CREATE UNIQUE INDEX "ad_provider_configs_provider_key" ON "ad_provider_configs"("provider");

CREATE INDEX "ad_advertisers_organisationId_idx" ON "ad_advertisers"("organisationId");
CREATE INDEX "ad_advertisers_status_idx" ON "ad_advertisers"("status");
CREATE INDEX "ad_campaigns_advertiserId_idx" ON "ad_campaigns"("advertiserId");
CREATE INDEX "ad_campaigns_status_idx" ON "ad_campaigns"("status");
CREATE INDEX "ad_campaigns_startAt_endAt_idx" ON "ad_campaigns"("startAt", "endAt");
CREATE INDEX "ad_creatives_campaignId_idx" ON "ad_creatives"("campaignId");
CREATE INDEX "ad_creatives_status_idx" ON "ad_creatives"("status");
CREATE INDEX "ad_placements_surface_idx" ON "ad_placements"("surface");
CREATE INDEX "ad_placement_rules_placementId_idx" ON "ad_placement_rules"("placementId");
CREATE INDEX "ad_campaign_targets_campaignId_idx" ON "ad_campaign_targets"("campaignId");
CREATE INDEX "ad_campaign_targets_region_idx" ON "ad_campaign_targets"("region");
CREATE INDEX "ad_campaign_targets_category_idx" ON "ad_campaign_targets"("category");
CREATE INDEX "ad_decisions_requestId_idx" ON "ad_decisions"("requestId");
CREATE INDEX "ad_decisions_placementCode_idx" ON "ad_decisions"("placementCode");
CREATE INDEX "ad_decisions_campaignId_idx" ON "ad_decisions"("campaignId");
CREATE INDEX "ad_decisions_createdAt_idx" ON "ad_decisions"("createdAt");
CREATE INDEX "ad_impressions_decisionId_idx" ON "ad_impressions"("decisionId");
CREATE INDEX "ad_impressions_campaignId_idx" ON "ad_impressions"("campaignId");
CREATE INDEX "ad_impressions_placementCode_idx" ON "ad_impressions"("placementCode");
CREATE INDEX "ad_impressions_createdAt_idx" ON "ad_impressions"("createdAt");
CREATE INDEX "ad_clicks_impressionId_idx" ON "ad_clicks"("impressionId");
CREATE INDEX "ad_clicks_campaignId_idx" ON "ad_clicks"("campaignId");
CREATE INDEX "ad_clicks_createdAt_idx" ON "ad_clicks"("createdAt");
CREATE INDEX "ad_conversions_clickId_idx" ON "ad_conversions"("clickId");
CREATE INDEX "ad_policy_reviews_creativeId_idx" ON "ad_policy_reviews"("creativeId");
CREATE INDEX "ad_policy_reviews_status_idx" ON "ad_policy_reviews"("status");

ALTER TABLE "ad_advertisers"
  ADD CONSTRAINT "ad_advertisers_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ad_campaigns"
  ADD CONSTRAINT "ad_campaigns_advertiserId_fkey"
  FOREIGN KEY ("advertiserId") REFERENCES "ad_advertisers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ad_creatives"
  ADD CONSTRAINT "ad_creatives_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ad_placement_rules"
  ADD CONSTRAINT "ad_placement_rules_placementId_fkey"
  FOREIGN KEY ("placementId") REFERENCES "ad_placements"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ad_campaign_targets"
  ADD CONSTRAINT "ad_campaign_targets_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ad_decisions"
  ADD CONSTRAINT "ad_decisions_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ad_impressions"
  ADD CONSTRAINT "ad_impressions_decisionId_fkey"
  FOREIGN KEY ("decisionId") REFERENCES "ad_decisions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ad_impressions"
  ADD CONSTRAINT "ad_impressions_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ad_clicks"
  ADD CONSTRAINT "ad_clicks_impressionId_fkey"
  FOREIGN KEY ("impressionId") REFERENCES "ad_impressions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ad_clicks"
  ADD CONSTRAINT "ad_clicks_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ad_conversions"
  ADD CONSTRAINT "ad_conversions_clickId_fkey"
  FOREIGN KEY ("clickId") REFERENCES "ad_clicks"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ad_policy_reviews"
  ADD CONSTRAINT "ad_policy_reviews_creativeId_fkey"
  FOREIGN KEY ("creativeId") REFERENCES "ad_creatives"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
