-- Create table for service agreement negotiation history
CREATE TABLE "ServiceAgreementRevision" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changeSetJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceAgreementRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceAgreementRevision_agreementId_createdAt_idx"
ON "ServiceAgreementRevision"("agreementId", "createdAt");

CREATE INDEX "ServiceAgreementRevision_authorUserId_idx"
ON "ServiceAgreementRevision"("authorUserId");

ALTER TABLE "ServiceAgreementRevision"
ADD CONSTRAINT "ServiceAgreementRevision_agreementId_fkey"
FOREIGN KEY ("agreementId") REFERENCES "ServiceAgreement"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceAgreementRevision"
ADD CONSTRAINT "ServiceAgreementRevision_authorUserId_fkey"
FOREIGN KEY ("authorUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
