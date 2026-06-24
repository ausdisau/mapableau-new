-- Drop erroneous one-line-per-invoice constraint
DROP INDEX IF EXISTS "InvoiceLine_invoiceId_key";

-- NdisSupportItem matching hints
ALTER TABLE "NdisSupportItem" ADD COLUMN IF NOT EXISTS "registrationGroupId" TEXT;
ALTER TABLE "NdisSupportItem" ADD COLUMN IF NOT EXISTS "serviceTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "NdisSupportItem" ADD COLUMN IF NOT EXISTS "providerTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "NdisSupportItem" ADD COLUMN IF NOT EXISTS "matchContextJson" JSONB;

CREATE INDEX IF NOT EXISTS "NdisSupportItem_registrationGroupId_idx" ON "NdisSupportItem"("registrationGroupId");

CREATE TABLE IF NOT EXISTS "NdisRegistrationGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NdisRegistrationGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NdisRegistrationGroup_code_key" ON "NdisRegistrationGroup"("code");

ALTER TABLE "NdisSupportItem" ADD CONSTRAINT "NdisSupportItem_registrationGroupId_fkey" FOREIGN KEY ("registrationGroupId") REFERENCES "NdisRegistrationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "NdisClaimRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleJson" JSONB NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NdisClaimRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NdisClaimRule_code_key" ON "NdisClaimRule"("code");

CREATE TYPE "NdisQuoteLineStatus" AS ENUM ('draft', 'calculated', 'review_required');
CREATE TYPE "NdisClaimValidationStatus" AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE "NdisClaimFindingAudience" AS ENUM ('participant', 'provider', 'admin');
CREATE TYPE "NdisClaimFindingSeverity" AS ENUM ('info', 'warning', 'error');

CREATE TABLE IF NOT EXISTS "NdisQuoteLine" (
    "id" TEXT NOT NULL,
    "supportItemId" TEXT,
    "supportItemCode" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unitType" TEXT,
    "unitAmountCents" INTEGER,
    "totalAmountCents" INTEGER,
    "serviceDate" TIMESTAMP(3),
    "status" "NdisQuoteLineStatus" NOT NULL DEFAULT 'draft',
    "warningsJson" JSONB NOT NULL DEFAULT '[]',
    "createdById" TEXT NOT NULL,
    "organisationId" TEXT,
    "participantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NdisQuoteLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NdisQuoteLine_createdById_idx" ON "NdisQuoteLine"("createdById");
CREATE INDEX IF NOT EXISTS "NdisQuoteLine_organisationId_idx" ON "NdisQuoteLine"("organisationId");

ALTER TABLE "NdisQuoteLine" ADD CONSTRAINT "NdisQuoteLine_supportItemId_fkey" FOREIGN KEY ("supportItemId") REFERENCES "NdisSupportItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "NdisClaimValidationRun" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "status" "NdisClaimValidationStatus" NOT NULL DEFAULT 'pending',
    "summary" TEXT,
    "warningsCount" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "organisationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "NdisClaimValidationRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NdisClaimValidationRun_invoiceId_createdAt_idx" ON "NdisClaimValidationRun"("invoiceId", "createdAt");

ALTER TABLE "NdisClaimValidationRun" ADD CONSTRAINT "NdisClaimValidationRun_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "NdisClaimValidationFinding" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "severity" "NdisClaimFindingSeverity" NOT NULL DEFAULT 'warning',
    "audience" "NdisClaimFindingAudience" NOT NULL DEFAULT 'provider',
    "plainMessage" TEXT,
    "technicalMessage" TEXT NOT NULL,
    "invoiceLineId" TEXT,
    "supportItemCode" TEXT,
    "metadataJson" JSONB,
    CONSTRAINT "NdisClaimValidationFinding_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NdisClaimValidationFinding_runId_idx" ON "NdisClaimValidationFinding"("runId");

ALTER TABLE "NdisClaimValidationFinding" ADD CONSTRAINT "NdisClaimValidationFinding_runId_fkey" FOREIGN KEY ("runId") REFERENCES "NdisClaimValidationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "InvoiceLine_supportItemCode_idx" ON "InvoiceLine"("supportItemCode");
