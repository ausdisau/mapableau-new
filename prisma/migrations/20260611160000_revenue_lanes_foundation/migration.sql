-- Revenue lanes foundation: usage ledger, plan_manager_pro, claim pack billing fields

CREATE TYPE "UsageEventCategory" AS ENUM (
  'api_call',
  'export',
  'invoice',
  'module_completion',
  'ai_assist',
  'validation',
  'licensed_pack'
);

ALTER TYPE "BillingSubscriptionPlanCode" ADD VALUE IF NOT EXISTS 'plan_manager_pro';

CREATE TABLE "UsageEvent" (
  "id" TEXT NOT NULL,
  "category" "UsageEventCategory" NOT NULL,
  "eventType" TEXT NOT NULL,
  "userId" TEXT,
  "organisationId" TEXT,
  "developerAppId" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UsageEvent_category_createdAt_idx" ON "UsageEvent"("category", "createdAt");
CREATE INDEX "UsageEvent_organisationId_createdAt_idx" ON "UsageEvent"("organisationId", "createdAt");
CREATE INDEX "UsageEvent_userId_createdAt_idx" ON "UsageEvent"("userId", "createdAt");
CREATE INDEX "UsageEvent_developerAppId_createdAt_idx" ON "UsageEvent"("developerAppId", "createdAt");

ALTER TABLE "PartnerBillingAccount" ADD COLUMN IF NOT EXISTS "licensedPackTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "AbilityPayClaimPack" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "AbilityPayClaimPack" ADD COLUMN IF NOT EXISTS "billingStatus" TEXT NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS "AbilityPayClaimPack_organisationId_idx" ON "AbilityPayClaimPack"("organisationId");
