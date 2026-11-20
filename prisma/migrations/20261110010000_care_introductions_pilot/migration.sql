-- Care introductions (Greater Sydney pilot). Never auto-assigns.
CREATE TYPE "CareIntroductionStatus" AS ENUM ('requested', 'accepted', 'declined', 'withdrawn', 'expired');

CREATE TABLE "care_introductions" (
    "id" TEXT NOT NULL,
    "careRequestId" TEXT,
    "participantId" TEXT NOT NULL,
    "candidateType" TEXT NOT NULL,
    "candidateWorkerProfileId" TEXT,
    "candidateOrganisationId" TEXT,
    "lane" TEXT,
    "status" "CareIntroductionStatus" NOT NULL DEFAULT 'requested',
    "messageToCandidate" TEXT,
    "responseNote" TEXT,
    "requestedById" TEXT NOT NULL,
    "respondedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "rankingCriteria" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_introductions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "care_introductions_participantId_status_idx" ON "care_introductions"("participantId", "status");
CREATE INDEX "care_introductions_careRequestId_idx" ON "care_introductions"("careRequestId");
CREATE INDEX "care_introductions_candidateOrganisationId_status_idx" ON "care_introductions"("candidateOrganisationId", "status");
CREATE INDEX "care_introductions_candidateWorkerProfileId_status_idx" ON "care_introductions"("candidateWorkerProfileId", "status");

ALTER TABLE "care_introductions" ADD CONSTRAINT "care_introductions_careRequestId_fkey" FOREIGN KEY ("careRequestId") REFERENCES "care_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "care_introductions" ADD CONSTRAINT "care_introductions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "care_introductions" ADD CONSTRAINT "care_introductions_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "care_introductions" ADD CONSTRAINT "care_introductions_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
