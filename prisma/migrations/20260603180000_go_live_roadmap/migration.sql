-- Go-live roadmap: NDIA remittance ingestion + billing reconciliation bridge

ALTER TABLE "PaymentReconciliationException" ADD COLUMN IF NOT EXISTS "billingInvoiceId" TEXT;

CREATE TABLE IF NOT EXISTS "NdiaRemittanceImport" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "importedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "summaryJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NdiaRemittanceImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdiaRemittanceLine" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "externalClaimId" TEXT,
    "claimId" TEXT,
    "participantRef" TEXT,
    "amountCents" INTEGER NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "matchStatus" TEXT NOT NULL DEFAULT 'unmatched',
    "rawRowJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NdiaRemittanceLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NdiaRemittanceImport_organisationId_createdAt_idx" ON "NdiaRemittanceImport"("organisationId", "createdAt");
CREATE INDEX IF NOT EXISTS "NdiaRemittanceLine_importId_idx" ON "NdiaRemittanceLine"("importId");
CREATE INDEX IF NOT EXISTS "NdiaRemittanceLine_externalClaimId_idx" ON "NdiaRemittanceLine"("externalClaimId");
CREATE INDEX IF NOT EXISTS "NdiaRemittanceLine_claimId_idx" ON "NdiaRemittanceLine"("claimId");

ALTER TABLE "NdiaRemittanceImport" ADD CONSTRAINT "NdiaRemittanceImport_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdiaRemittanceLine" ADD CONSTRAINT "NdiaRemittanceLine_importId_fkey" FOREIGN KEY ("importId") REFERENCES "NdiaRemittanceImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
