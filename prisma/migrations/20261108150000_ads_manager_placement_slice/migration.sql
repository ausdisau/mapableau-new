-- Ads Manager P1 + §14.11 placement slice (additive, flag-gated).

CREATE TYPE "AdManagerLifecycleStatus" AS ENUM (
  'DRAFT',
  'VALIDATING',
  'AWAITING_REVIEW',
  'CHANGES_REQUESTED',
  'REJECTED',
  'APPROVED',
  'QUOTE_PENDING',
  'AWAITING_SPEND_AUTHORISATION',
  'AUTHORISING',
  'READY_TO_SUBMIT',
  'SUBMITTING',
  'SCHEDULED',
  'PARTIALLY_SCHEDULED',
  'SUBMISSION_UNKNOWN',
  'FAILED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
  'RECONCILED',
  'CLOSED'
);

CREATE TYPE "AdBuyingChannel" AS ENUM ('mapable', 'meta', 'google', 'tiktok', 'linkedin', 'dooh');

CREATE TYPE "AdIntegrationStatus" AS ENUM ('demo', 'pending_access', 'enabled', 'degraded', 'disabled');

CREATE TYPE "AdProviderAssuranceState" AS ENUM (
  'catalogued',
  'source_reviewed',
  'vendor_confirmed',
  'commercially_approved',
  'sandbox_verified',
  'security_privacy_accessibility_signed_off',
  'limited_live',
  'production_enabled',
  'suspended'
);

CREATE TYPE "AdAvailabilityState" AS ENUM ('confirmed', 'indicative', 'unknown', 'unavailable');

CREATE TYPE "AdBuyingMode" AS ENUM (
  'owned_reservation',
  'guaranteed',
  'preferred_deal',
  'private_auction',
  'open_auction',
  'social_platform'
);

CREATE TYPE "AdQuoteKind" AS ENUM ('indicative', 'firm');

CREATE TYPE "AdPlacementOrderStatus" AS ENUM (
  'draft',
  'review_pending',
  'reviewed',
  'spend_pending',
  'spend_approved',
  'submission_pending',
  'unknown_external_state',
  'accepted',
  'live',
  'paused_pending',
  'paused_confirmed',
  'completed',
  'cancelled',
  'failed',
  'disputed',
  'reconciled'
);

CREATE TYPE "AdEvidenceKind" AS ENUM (
  'verified_play_log',
  'partner_reported_play',
  'modelled_impressions',
  'unavailable'
);

ALTER TABLE "ad_campaigns"
  ADD COLUMN "lifecycleStatus" "AdManagerLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "lifecycleVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "budgetMinor" BIGINT,
  ADD COLUMN "budgetCurrency" TEXT NOT NULL DEFAULT 'AUD',
  ADD COLUMN "objective" TEXT,
  ADD COLUMN "createdByUserId" TEXT;

CREATE INDEX "ad_campaigns_lifecycleStatus_idx" ON "ad_campaigns"("lifecycleStatus");

ALTER TABLE "ad_policy_reviews"
  ADD COLUMN "reasonCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "policyVersion" TEXT,
  ADD COLUMN "evidenceRef" TEXT;

CREATE TABLE "ad_campaign_allocations" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "channel" "AdBuyingChannel" NOT NULL,
  "capMinor" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "status" TEXT NOT NULL DEFAULT 'planned',
  "quoteId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_campaign_allocations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_campaign_allocations_campaignId_channel_key" ON "ad_campaign_allocations"("campaignId", "channel");
CREATE INDEX "ad_campaign_allocations_campaignId_idx" ON "ad_campaign_allocations"("campaignId");

ALTER TABLE "ad_campaign_allocations"
  ADD CONSTRAINT "ad_campaign_allocations_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ad_provider_catalog_entries" (
  "id" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "catalogProviderId" TEXT NOT NULL,
  "displayName" TEXT,
  "contentHash" TEXT NOT NULL,
  "etag" TEXT,
  "evidenceClass" TEXT NOT NULL DEFAULT 'catalogue_or_public_docs_only',
  "assuranceState" "AdProviderAssuranceState" NOT NULL DEFAULT 'catalogued',
  "rawMetadataJson" JSONB,
  "retrievedAt" TIMESTAMP(3) NOT NULL,
  "verifiedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_provider_catalog_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_provider_catalog_entries_catalogProviderId_sourceUrl_key"
  ON "ad_provider_catalog_entries"("catalogProviderId", "sourceUrl");
CREATE INDEX "ad_provider_catalog_entries_assuranceState_idx" ON "ad_provider_catalog_entries"("assuranceState");
CREATE INDEX "ad_provider_catalog_entries_retrievedAt_idx" ON "ad_provider_catalog_entries"("retrievedAt");

CREATE TABLE "ad_provider_entitlements" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "advertiserId" TEXT,
  "providerId" TEXT NOT NULL,
  "buyingModes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "countryCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "accountRef" TEXT,
  "contractRef" TEXT,
  "accessState" "AdIntegrationStatus" NOT NULL DEFAULT 'demo',
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_provider_entitlements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ad_provider_entitlements_organisationId_idx" ON "ad_provider_entitlements"("organisationId");
CREATE INDEX "ad_provider_entitlements_advertiserId_idx" ON "ad_provider_entitlements"("advertiserId");
CREATE INDEX "ad_provider_entitlements_providerId_idx" ON "ad_provider_entitlements"("providerId");

CREATE TABLE "ad_provider_capability_snapshots" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "apiVersion" TEXT,
  "canDiscover" BOOLEAN NOT NULL DEFAULT false,
  "canQuote" BOOLEAN NOT NULL DEFAULT false,
  "canBook" BOOLEAN NOT NULL DEFAULT false,
  "canPause" BOOLEAN NOT NULL DEFAULT false,
  "canReport" BOOLEAN NOT NULL DEFAULT false,
  "canReconcile" BOOLEAN NOT NULL DEFAULT false,
  "status" "AdIntegrationStatus" NOT NULL DEFAULT 'demo',
  "observedAt" TIMESTAMP(3) NOT NULL,
  "snapshotJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_provider_capability_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ad_provider_capability_snapshots_providerId_idx" ON "ad_provider_capability_snapshots"("providerId");

CREATE TABLE "ad_placement_opportunities" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "advertiserId" TEXT,
  "externalInventoryId" TEXT NOT NULL,
  "channel" "AdBuyingChannel" NOT NULL,
  "providerId" TEXT NOT NULL,
  "inventoryType" TEXT NOT NULL,
  "geoRegion" TEXT,
  "timeZone" TEXT,
  "formatSpecsJson" JSONB,
  "policyRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "inventorySource" TEXT NOT NULL,
  "sourceObservedAt" TIMESTAMP(3) NOT NULL,
  "availabilityState" "AdAvailabilityState" NOT NULL DEFAULT 'indicative',
  "availabilityExpiresAt" TIMESTAMP(3),
  "buyingMode" "AdBuyingMode" NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "minimumSpendMinor" BIGINT,
  "priceEstimateMinor" BIGINT,
  "screenEnvironment" TEXT,
  "accessibilityReqsJson" JSONB,
  "forecastProvenance" TEXT,
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_placement_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_placement_opportunities_providerId_externalInventoryId_key"
  ON "ad_placement_opportunities"("providerId", "externalInventoryId");
CREATE INDEX "ad_placement_opportunities_channel_idx" ON "ad_placement_opportunities"("channel");
CREATE INDEX "ad_placement_opportunities_availabilityState_idx" ON "ad_placement_opportunities"("availabilityState");
CREATE INDEX "ad_placement_opportunities_organisationId_idx" ON "ad_placement_opportunities"("organisationId");

CREATE TABLE "ad_placement_rule_versions" (
  "id" TEXT NOT NULL,
  "ruleVersion" TEXT NOT NULL,
  "policyHash" TEXT NOT NULL,
  "eligibleFilters" JSONB NOT NULL,
  "rankWeights" JSONB NOT NULL,
  "approvedBy" TEXT,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_placement_rule_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_placement_rule_versions_ruleVersion_key" ON "ad_placement_rule_versions"("ruleVersion");

CREATE TABLE "ad_placement_quotes" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT,
  "advertiserId" TEXT NOT NULL,
  "organisationId" TEXT,
  "opportunityId" TEXT,
  "providerId" TEXT NOT NULL,
  "channel" "AdBuyingChannel" NOT NULL,
  "quoteKind" "AdQuoteKind" NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "mediaMinor" BIGINT NOT NULL,
  "partnerFeesMinor" BIGINT NOT NULL DEFAULT 0,
  "platformFeesMinor" BIGINT NOT NULL DEFAULT 0,
  "taxMinor" BIGINT NOT NULL DEFAULT 0,
  "totalMinor" BIGINT NOT NULL,
  "termsHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "isInventoryReserved" BOOLEAN NOT NULL DEFAULT false,
  "buyingMode" "AdBuyingMode" NOT NULL,
  "capabilityStatus" "AdIntegrationStatus" NOT NULL DEFAULT 'demo',
  "provenanceJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_placement_quotes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ad_placement_quotes_advertiserId_idx" ON "ad_placement_quotes"("advertiserId");
CREATE INDEX "ad_placement_quotes_campaignId_idx" ON "ad_placement_quotes"("campaignId");
CREATE INDEX "ad_placement_quotes_expiresAt_idx" ON "ad_placement_quotes"("expiresAt");

ALTER TABLE "ad_placement_quotes"
  ADD CONSTRAINT "ad_placement_quotes_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ad_spend_authorisations" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT,
  "quoteId" TEXT NOT NULL,
  "advertiserId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "approvedAmountMinor" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "quoteHash" TEXT NOT NULL,
  "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_spend_authorisations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ad_spend_authorisations_advertiserId_idx" ON "ad_spend_authorisations"("advertiserId");
CREATE INDEX "ad_spend_authorisations_quoteId_idx" ON "ad_spend_authorisations"("quoteId");

ALTER TABLE "ad_spend_authorisations"
  ADD CONSTRAINT "ad_spend_authorisations_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ad_spend_authorisations_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "ad_placement_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ad_placement_orders" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT,
  "advertiserId" TEXT NOT NULL,
  "organisationId" TEXT,
  "quoteId" TEXT NOT NULL,
  "spendAuthorisationId" TEXT NOT NULL,
  "channel" "AdBuyingChannel" NOT NULL,
  "providerId" TEXT NOT NULL,
  "status" "AdPlacementOrderStatus" NOT NULL DEFAULT 'submission_pending',
  "externalOrderId" TEXT,
  "requestId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "providerStatus" TEXT,
  "lastReconciledAt" TIMESTAMP(3),
  "committedBudgetMinor" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "freezeRetry" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_placement_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_placement_orders_idempotencyKey_key" ON "ad_placement_orders"("idempotencyKey");
CREATE INDEX "ad_placement_orders_advertiserId_idx" ON "ad_placement_orders"("advertiserId");
CREATE INDEX "ad_placement_orders_campaignId_idx" ON "ad_placement_orders"("campaignId");
CREATE INDEX "ad_placement_orders_status_idx" ON "ad_placement_orders"("status");
CREATE INDEX "ad_placement_orders_externalOrderId_idx" ON "ad_placement_orders"("externalOrderId");

ALTER TABLE "ad_placement_orders"
  ADD CONSTRAINT "ad_placement_orders_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ad_placement_orders_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "ad_placement_quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ad_placement_orders_spendAuthorisationId_fkey"
  FOREIGN KEY ("spendAuthorisationId") REFERENCES "ad_spend_authorisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ad_external_submissions" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "requestRef" TEXT NOT NULL,
  "providerOrderId" TEXT,
  "requestHash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "responseCode" INTEGER,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_external_submissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_external_submissions_orderId_requestRef_key" ON "ad_external_submissions"("orderId", "requestRef");
CREATE INDEX "ad_external_submissions_providerId_idx" ON "ad_external_submissions"("providerId");

ALTER TABLE "ad_external_submissions"
  ADD CONSTRAINT "ad_external_submissions_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "ad_placement_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ad_delivery_evidence" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "evidenceKind" "AdEvidenceKind" NOT NULL,
  "metric" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "unit" TEXT,
  "windowStart" TIMESTAMP(3),
  "windowEnd" TIMESTAMP(3),
  "asOf" TIMESTAMP(3) NOT NULL,
  "licenceRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_delivery_evidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ad_delivery_evidence_orderId_idx" ON "ad_delivery_evidence"("orderId");
CREATE INDEX "ad_delivery_evidence_asOf_idx" ON "ad_delivery_evidence"("asOf");

ALTER TABLE "ad_delivery_evidence"
  ADD CONSTRAINT "ad_delivery_evidence_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "ad_placement_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ad_disputes_and_corrections" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "ownerUserId" TEXT,
  "reason" TEXT NOT NULL,
  "financialImpactMinor" BIGINT,
  "evidenceRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'open',
  "resolution" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_disputes_and_corrections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ad_disputes_and_corrections_orderId_idx" ON "ad_disputes_and_corrections"("orderId");
CREATE INDEX "ad_disputes_and_corrections_status_idx" ON "ad_disputes_and_corrections"("status");

ALTER TABLE "ad_disputes_and_corrections"
  ADD CONSTRAINT "ad_disputes_and_corrections_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "ad_placement_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ad_manager_idempotency_records" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "advertiserId" TEXT,
  "requestHash" TEXT NOT NULL,
  "responseStatus" INTEGER NOT NULL,
  "responseBody" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_manager_idempotency_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_manager_idempotency_records_scope_idempotencyKey_key"
  ON "ad_manager_idempotency_records"("scope", "idempotencyKey");
CREATE INDEX "ad_manager_idempotency_records_createdAt_idx" ON "ad_manager_idempotency_records"("createdAt");
