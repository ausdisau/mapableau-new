-- CreateEnum
CREATE TYPE "WwcJurisdiction" AS ENUM ('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT');

-- CreateEnum
CREATE TYPE "WwcCheckType" AS ENUM ('working_with_children_check', 'blue_card', 'working_with_vulnerable_people', 'ochre_card');

-- CreateEnum
CREATE TYPE "WwcVerificationStatus" AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'needs_more_information', 'not_required', 'expired', 'suspended', 'barred');

-- CreateEnum
CREATE TYPE "WwcVerificationEventType" AS ENUM ('submitted', 'evidence_attached', 'review_started', 'approved', 'rejected', 'needs_more_information', 'not_required', 'expired', 'suspended', 'barred', 'expiry_updated', 'next_check_scheduled', 'eligibility_recalculated', 'note_added');

-- CreateTable
CREATE TABLE "WwcVerification" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "jurisdiction" "WwcJurisdiction" NOT NULL,
    "checkType" "WwcCheckType" NOT NULL,
    "checkNumber" TEXT NOT NULL,
    "legalFirstName" TEXT NOT NULL,
    "legalLastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "status" "WwcVerificationStatus" NOT NULL DEFAULT 'draft',
    "verifiedName" TEXT,
    "verifiedResult" TEXT,
    "verifiedPayloadJson" JSONB,
    "evidenceDocumentId" TEXT,
    "checkedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "nextCheckAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "consentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WwcVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WwcVerificationEvent" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "eventType" "WwcVerificationEventType" NOT NULL,
    "actorUserId" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WwcVerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WwcVerification_workerProfileId_status_idx" ON "WwcVerification"("workerProfileId", "status");

-- CreateIndex
CREATE INDEX "WwcVerification_organisationId_status_idx" ON "WwcVerification"("organisationId", "status");

-- CreateIndex
CREATE INDEX "WwcVerification_expiresAt_idx" ON "WwcVerification"("expiresAt");

-- CreateIndex
CREATE INDEX "WwcVerificationEvent_verificationId_createdAt_idx" ON "WwcVerificationEvent"("verificationId", "createdAt");

-- AddForeignKey
ALTER TABLE "WwcVerification" ADD CONSTRAINT "WwcVerification_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WwcVerification" ADD CONSTRAINT "WwcVerification_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WwcVerification" ADD CONSTRAINT "WwcVerification_evidenceDocumentId_fkey" FOREIGN KEY ("evidenceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WwcVerification" ADD CONSTRAINT "WwcVerification_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WwcVerificationEvent" ADD CONSTRAINT "WwcVerificationEvent_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "WwcVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WwcVerificationEvent" ADD CONSTRAINT "WwcVerificationEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
