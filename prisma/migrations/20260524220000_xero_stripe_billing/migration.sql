-- Invoice status expansion
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'awaiting_participant_approval';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'issued';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'payment_pending';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'sent_to_plan_manager';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'overdue';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'disputed';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'void';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'refunded';

CREATE TYPE "BillingEventType" AS ENUM (
  'created', 'updated', 'issued', 'approval_requested', 'approved', 'disputed',
  'voided', 'payment_pending', 'paid', 'partially_paid', 'xero_sync_started',
  'xero_synced', 'xero_sync_failed', 'manual_payment', 'refunded', 'sent_to_plan_manager'
);
CREATE TYPE "InvoiceApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "InvoiceDisputeStatus" AS ENUM ('open', 'under_review', 'resolved', 'withdrawn');
CREATE TYPE "StripePaymentRecordStatus" AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');
CREATE TYPE "XeroConnectionStatus" AS ENUM ('active', 'disconnected', 'refresh_failed');
CREATE TYPE "XeroInvoiceSyncStatus" AS ENUM ('pending', 'syncing', 'synced', 'failed');

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "serviceType" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sourceType" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sourceId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "issuedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "privatePayCents" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "ndisMetadata" JSONB;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "requiresParticipantApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "xeroAccountCode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "Invoice_sourceType_sourceId_idx" ON "Invoice"("sourceType", "sourceId");

ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "plainDescription" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "xeroAccountCode" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "xeroTaxType" TEXT;
DROP INDEX IF EXISTS "InvoiceLine_invoiceId_key";

CREATE TABLE IF NOT EXISTS "BillingEvent" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "eventType" "BillingEventType" NOT NULL,
    "fromStatus" "InvoiceStatus",
    "toStatus" "InvoiceStatus",
    "actorUserId" TEXT,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BillingEvent_invoiceId_createdAt_idx" ON "BillingEvent"("invoiceId", "createdAt");
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "InvoiceApproval" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "approverUserId" TEXT NOT NULL,
    "approverRole" TEXT,
    "status" "InvoiceApprovalStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceApproval_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InvoiceApproval_invoiceId_idx" ON "InvoiceApproval"("invoiceId");
ALTER TABLE "InvoiceApproval" ADD CONSTRAINT "InvoiceApproval_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "InvoiceDispute" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "raisedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "InvoiceDisputeStatus" NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InvoiceDispute_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InvoiceDispute_invoiceId_idx" ON "InvoiceDispute"("invoiceId");
ALTER TABLE "InvoiceDispute" ADD CONSTRAINT "InvoiceDispute_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "StripePaymentRecord" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "status" "StripePaymentRecordStatus" NOT NULL DEFAULT 'pending',
    "idempotencyKey" TEXT,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StripePaymentRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StripePaymentRecord_stripeCheckoutSessionId_key" ON "StripePaymentRecord"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "StripePaymentRecord_stripePaymentIntentId_key" ON "StripePaymentRecord"("stripePaymentIntentId");
CREATE UNIQUE INDEX IF NOT EXISTS "StripePaymentRecord_idempotencyKey_key" ON "StripePaymentRecord"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "StripePaymentRecord_invoiceId_idx" ON "StripePaymentRecord"("invoiceId");
ALTER TABLE "StripePaymentRecord" ADD CONSTRAINT "StripePaymentRecord_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "XeroConnection" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantName" TEXT,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "scopes" TEXT,
    "status" "XeroConnectionStatus" NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "connectedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "XeroConnection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "XeroConnection_organisationId_key" ON "XeroConnection"("organisationId");
CREATE INDEX IF NOT EXISTS "XeroConnection_tenantId_idx" ON "XeroConnection"("tenantId");
ALTER TABLE "XeroConnection" ADD CONSTRAINT "XeroConnection_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "XeroInvoiceSyncRecord" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "XeroInvoiceSyncRecord" ADD COLUMN IF NOT EXISTS "payloadHash" TEXT;
ALTER TABLE "XeroInvoiceSyncRecord" ADD COLUMN IF NOT EXISTS "attemptNumber" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "XeroInvoiceSyncRecord_payloadHash_idx" ON "XeroInvoiceSyncRecord"("payloadHash");
