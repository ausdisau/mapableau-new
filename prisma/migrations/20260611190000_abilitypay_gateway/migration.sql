-- AbilityPay payment gateway: funding models, payment attempts, extended payment statuses

CREATE TYPE "AbilityPayFundingModel" AS ENUM ('plan_managed', 'self_managed', 'agency_managed', 'private_pay');

ALTER TYPE "AbilityPayPaymentStatus" ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE "AbilityPayPaymentStatus" ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE "AbilityPayPaymentStatus" ADD VALUE IF NOT EXISTS 'failed';
ALTER TYPE "AbilityPayPaymentStatus" ADD VALUE IF NOT EXISTS 'refunded';

CREATE TYPE "AbilityPayPaymentAdapter" AS ENUM ('plan_export', 'stripe_checkout', 'ndia_claim', 'manual');
CREATE TYPE "AbilityPayPaymentAttemptStatus" AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');

ALTER TABLE "AbilityPayParticipantPlan" ADD COLUMN "fundingModel" "AbilityPayFundingModel" NOT NULL DEFAULT 'plan_managed';

ALTER TABLE "AbilityPayInvoice" ADD COLUMN "fundingModel" "AbilityPayFundingModel";
ALTER TABLE "AbilityPayInvoice" ADD COLUMN "billing_invoice_id" TEXT;

CREATE UNIQUE INDEX "AbilityPayInvoice_billing_invoice_id_key" ON "AbilityPayInvoice"("billing_invoice_id");
CREATE INDEX "AbilityPayInvoice_billing_invoice_id_idx" ON "AbilityPayInvoice"("billing_invoice_id");

CREATE TABLE "AbilityPayPaymentAttempt" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "adapter" "AbilityPayPaymentAdapter" NOT NULL,
    "status" "AbilityPayPaymentAttemptStatus" NOT NULL DEFAULT 'pending',
    "external_ref" TEXT,
    "billing_invoice_id" TEXT,
    "billing_payment_id" TEXT,
    "claim_pack_id" TEXT,
    "failure_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbilityPayPaymentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AbilityPayPaymentAttempt_invoice_id_idx" ON "AbilityPayPaymentAttempt"("invoice_id");
CREATE INDEX "AbilityPayPaymentAttempt_adapter_status_idx" ON "AbilityPayPaymentAttempt"("adapter", "status");
CREATE INDEX "AbilityPayPaymentAttempt_billing_invoice_id_idx" ON "AbilityPayPaymentAttempt"("billing_invoice_id");

ALTER TABLE "AbilityPayPaymentAttempt" ADD CONSTRAINT "AbilityPayPaymentAttempt_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "AbilityPayInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
