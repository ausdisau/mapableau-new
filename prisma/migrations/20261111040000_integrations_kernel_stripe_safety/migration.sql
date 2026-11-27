-- Stripe webhook processing states (additive; keep legacy processed boolean in sync)
CREATE TYPE "BillingStripeWebhookProcessingStatus" AS ENUM (
  'pending',
  'processing',
  'processed',
  'failed',
  'quarantined'
);

ALTER TABLE "BillingStripeWebhookEvent"
  ADD COLUMN IF NOT EXISTS "processingStatus" "BillingStripeWebhookProcessingStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "lastError" TEXT,
  ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "claimExpiresAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "BillingStripeWebhookEvent_processingStatus_idx"
  ON "BillingStripeWebhookEvent"("processingStatus");

ALTER TABLE "StripeWebhookEvent"
  ADD COLUMN IF NOT EXISTS "processingStatus" "BillingStripeWebhookProcessingStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "lastError" TEXT,
  ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "claimExpiresAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_processingStatus_idx"
  ON "StripeWebhookEvent"("processingStatus");

-- Org-scoped integration connection hardening
ALTER TABLE "BillingIntegrationConnection"
  ADD COLUMN IF NOT EXISTS "tokenCiphertext" TEXT,
  ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "permissionMetadata" JSONB,
  ADD COLUMN IF NOT EXISTS "connectedById" TEXT,
  ADD COLUMN IF NOT EXISTS "connectedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "revokedById" TEXT,
  ADD COLUMN IF NOT EXISTS "lastSuccessfulSyncAt" TIMESTAMP(3);

CREATE TYPE "IntegrationDeliveryState" AS ENUM (
  'pending',
  'running',
  'delivered',
  'retryable',
  'needs_review',
  'dead_letter'
);

CREATE TYPE "IntegrationProvider" AS ENUM (
  'deputy',
  'xero',
  'stripe'
);

CREATE TABLE IF NOT EXISTS "IntegrationExternalMapping" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "provider" "IntegrationProvider" NOT NULL,
  "internalType" TEXT NOT NULL,
  "internalId" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "externalVersion" TEXT,
  "syncState" TEXT NOT NULL DEFAULT 'active',
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationExternalMapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationExternalMapping_org_provider_internal_uid"
  ON "IntegrationExternalMapping"("organisationId", "provider", "internalType", "internalId");

CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationExternalMapping_org_provider_external_uid"
  ON "IntegrationExternalMapping"("organisationId", "provider", "internalType", "externalId");

CREATE INDEX IF NOT EXISTS "IntegrationExternalMapping_organisationId_provider_idx"
  ON "IntegrationExternalMapping"("organisationId", "provider");

CREATE TABLE IF NOT EXISTS "IntegrationDelivery" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "aggregateRevision" INTEGER NOT NULL DEFAULT 1,
  "provider" "IntegrationProvider" NOT NULL,
  "organisationId" TEXT NOT NULL,
  "externalTenantId" TEXT,
  "dedupeKey" TEXT NOT NULL,
  "payloadRefJson" JSONB,
  "state" "IntegrationDeliveryState" NOT NULL DEFAULT 'pending',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastErrorClass" TEXT,
  "lastErrorMessage" TEXT,
  "nextRetryAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "deadLetteredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationDelivery_dedupeKey_key"
  ON "IntegrationDelivery"("dedupeKey");

CREATE INDEX IF NOT EXISTS "IntegrationDelivery_state_nextRetryAt_idx"
  ON "IntegrationDelivery"("state", "nextRetryAt");

CREATE INDEX IF NOT EXISTS "IntegrationDelivery_organisationId_provider_idx"
  ON "IntegrationDelivery"("organisationId", "provider");

CREATE INDEX IF NOT EXISTS "IntegrationDelivery_aggregateType_aggregateId_idx"
  ON "IntegrationDelivery"("aggregateType", "aggregateId");

CREATE TABLE IF NOT EXISTS "IntegrationReconciliation" (
  "id" TEXT NOT NULL,
  "provider" "IntegrationProvider" NOT NULL,
  "organisationId" TEXT NOT NULL,
  "externalTenantId" TEXT,
  "cursorSince" TIMESTAMP(3),
  "observedRemoteStatus" TEXT,
  "discrepancyType" TEXT,
  "lastResult" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationReconciliation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IntegrationReconciliation_org_provider_idx"
  ON "IntegrationReconciliation"("organisationId", "provider");

CREATE INDEX IF NOT EXISTS "IntegrationReconciliation_provider_createdAt_idx"
  ON "IntegrationReconciliation"("provider", "createdAt");
