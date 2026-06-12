-- CreateEnum
CREATE TYPE "AbilityPayInvoiceSourceType" AS ENUM ('provider_upload', 'care_service_log', 'delivery_event', 'billing_invoice');

-- AlterTable
ALTER TABLE "AbilityPayInvoice" ADD COLUMN "source_type" "AbilityPayInvoiceSourceType",
ADD COLUMN "source_ref_id" TEXT;

-- CreateIndex
CREATE INDEX "AbilityPayInvoice_source_type_source_ref_id_idx" ON "AbilityPayInvoice"("source_type", "source_ref_id");
