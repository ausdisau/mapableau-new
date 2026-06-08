-- MapAble Ads Manager

-- AlterEnum
ALTER TYPE "BillingServiceType" ADD VALUE IF NOT EXISTS 'advertising';

-- CreateEnum
CREATE TYPE "AdAdvertiserCategory" AS ENUM ('ndis_provider', 'allied_health', 'support_coordinator', 'plan_manager', 'accessible_transport', 'assistive_technology', 'inclusive_employer', 'accessible_tourism', 'disability_education', 'council_public_interest');
CREATE TYPE "AdAdvertiserOnboardingStatus" AS ENUM ('draft', 'pending_verification', 'active', 'suspended');
CREATE TYPE "AdCampaignStatus" AS ENUM ('draft', 'pending_payment', 'pending_review', 'approved', 'active', 'paused', 'ended', 'rejected');
CREATE TYPE "AdPlacement" AS ENUM ('skyscraper_left', 'skyscraper_right', 'sponsored_provider_card', 'banner_inline');
CREATE TYPE "AdCreativeFormat" AS ENUM ('image_text', 'text_only');
CREATE TYPE "AdModerationDecision" AS ENUM ('approved', 'rejected');

-- CreateTable
CREATE TABLE "AdAdvertiser" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "category" "AdAdvertiserCategory" NOT NULL,
    "onboardingStatus" "AdAdvertiserOnboardingStatus" NOT NULL DEFAULT 'draft',
    "termsAcceptedAt" TIMESTAMP(3),
    "contactName" TEXT,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdAdvertiser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AdCampaignStatus" NOT NULL DEFAULT 'draft',
    "budgetCents" INTEGER NOT NULL DEFAULT 0,
    "spentCents" INTEGER NOT NULL DEFAULT 0,
    "targeting" JSONB NOT NULL DEFAULT '{}',
    "billingInvoiceId" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdCreative" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "format" "AdCreativeFormat" NOT NULL DEFAULT 'image_text',
    "placements" "AdPlacement"[],
    "imageFileKey" TEXT,
    "imageMimeType" TEXT,
    "headline" TEXT NOT NULL,
    "body" TEXT,
    "ctaLabel" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "landingUrl" TEXT NOT NULL,
    "targetOrganisationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCreative_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdModerationReview" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "decision" "AdModerationDecision",
    "notes" TEXT,
    "reviewerId" TEXT,
    "policyFlags" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdModerationReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdMetricsDaily" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "placement" "AdPlacement" NOT NULL,
    "regionCode" TEXT NOT NULL DEFAULT 'AU',
    "deviceType" TEXT NOT NULL DEFAULT 'unknown',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AdMetricsDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdAdvertiser_organisationId_key" ON "AdAdvertiser"("organisationId");
CREATE INDEX "AdAdvertiser_onboardingStatus_idx" ON "AdAdvertiser"("onboardingStatus");
CREATE UNIQUE INDEX "AdCampaign_billingInvoiceId_key" ON "AdCampaign"("billingInvoiceId");
CREATE INDEX "AdCampaign_advertiserId_status_idx" ON "AdCampaign"("advertiserId", "status");
CREATE INDEX "AdCampaign_status_idx" ON "AdCampaign"("status");
CREATE INDEX "AdCreative_campaignId_idx" ON "AdCreative"("campaignId");
CREATE INDEX "AdModerationReview_campaignId_createdAt_idx" ON "AdModerationReview"("campaignId", "createdAt");
CREATE UNIQUE INDEX "AdMetricsDaily_campaignId_date_placement_regionCode_deviceType_key" ON "AdMetricsDaily"("campaignId", "date", "placement", "regionCode", "deviceType");
CREATE INDEX "AdMetricsDaily_campaignId_date_idx" ON "AdMetricsDaily"("campaignId", "date");

-- AddForeignKey
ALTER TABLE "AdAdvertiser" ADD CONSTRAINT "AdAdvertiser_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "AdAdvertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_billingInvoiceId_fkey" FOREIGN KEY ("billingInvoiceId") REFERENCES "BillingInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdCreative" ADD CONSTRAINT "AdCreative_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdModerationReview" ADD CONSTRAINT "AdModerationReview_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdModerationReview" ADD CONSTRAINT "AdModerationReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdMetricsDaily" ADD CONSTRAINT "AdMetricsDaily_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
