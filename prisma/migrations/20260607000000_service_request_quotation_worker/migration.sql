-- Service Request + Quotation worker (NDIS approval-gated)
-- Schema source of truth: prisma/schema.prisma
-- Deploy in this repo typically uses: npx prisma db push && npx prisma generate

DO $$ BEGIN
  CREATE TYPE "ServiceQuotationStatus" AS ENUM (
    'draft',
    'awaiting_approval',
    'ready_for_review',
    'confirmed',
    'rejected',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ServiceRequestApprovalStatus" AS ENUM (
    'pending',
    'approved',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "service_quotations" (
  "id" TEXT PRIMARY KEY,
  "careRequestId" TEXT NOT NULL,
  "status" "ServiceQuotationStatus" NOT NULL DEFAULT 'draft',
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "subtotalCents" INTEGER NOT NULL DEFAULT 0,
  "taxCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL DEFAULT 0,
  "lineItems" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "notes" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdById" TEXT NOT NULL,
  "approvedByUserId" TEXT,
  "rejectedReason" TEXT,
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "service_request_approvals" (
  "id" TEXT PRIMARY KEY,
  "careRequestId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "actorRole" TEXT NOT NULL,
  "decision" "ServiceRequestApprovalStatus" NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "decidedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "service_quotations"
  ADD CONSTRAINT "service_quotations_careRequestId_fkey"
  FOREIGN KEY ("careRequestId") REFERENCES "care_requests"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "service_request_approvals"
  ADD CONSTRAINT "service_request_approvals_careRequestId_fkey"
  FOREIGN KEY ("careRequestId") REFERENCES "care_requests"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "service_quotations_careRequestId_status_idx"
  ON "service_quotations"("careRequestId", "status");
CREATE INDEX IF NOT EXISTS "service_quotations_status_updatedAt_idx"
  ON "service_quotations"("status", "updatedAt");
CREATE INDEX IF NOT EXISTS "service_request_approvals_careRequestId_decision_idx"
  ON "service_request_approvals"("careRequestId", "decision");
CREATE INDEX IF NOT EXISTS "service_request_approvals_actorUserId_decidedAt_idx"
  ON "service_request_approvals"("actorUserId", "decidedAt");
