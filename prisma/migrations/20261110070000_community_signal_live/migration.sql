-- Additive, privacy-first community records. No browser-local or fictional data migration.
-- Do not run on production until target DATABASE_URL and backup/recovery are verified.
CREATE TABLE "CommunitySignalChallenge" (
  "id" TEXT NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "template" VARCHAR(30) NOT NULL,
  "boundary" VARCHAR(200) NOT NULL,
  "instruction" VARCHAR(1200) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunitySignalChallenge_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommunitySignalObservation" (
  "id" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "feature" VARCHAR(100) NOT NULL,
  "finding" TEXT NOT NULL,
  "method" VARCHAR(40) NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "consentScope" VARCHAR(20) NOT NULL DEFAULT 'private',
  "consentVersion" VARCHAR(50) NOT NULL,
  "consentAcknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consentWithdrawnAt" TIMESTAMP(3),
  "moderation" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "evidenceState" VARCHAR(20) NOT NULL DEFAULT 'reported',
  "rating" VARCHAR(15) NOT NULL DEFAULT 'unknown',
  "reviewerId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" VARCHAR(400),
  "publicAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunitySignalObservation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommunitySignalAudit" (
  "id" TEXT NOT NULL,
  "action" VARCHAR(40) NOT NULL,
  "entityType" VARCHAR(40) NOT NULL,
  "entityId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunitySignalAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CommunitySignalChallenge_status_createdAt_idx" ON "CommunitySignalChallenge"("status", "createdAt");
CREATE INDEX "CommunitySignalObservation_authorId_createdAt_idx" ON "CommunitySignalObservation"("authorId", "createdAt");
CREATE INDEX "CommunitySignalObservation_moderation_consentScope_consentWithdrawnAt_idx" ON "CommunitySignalObservation"("moderation", "consentScope", "consentWithdrawnAt");
CREATE INDEX "CommunitySignalObservation_challengeId_createdAt_idx" ON "CommunitySignalObservation"("challengeId", "createdAt");
CREATE INDEX "CommunitySignalAudit_entityType_entityId_createdAt_idx" ON "CommunitySignalAudit"("entityType", "entityId", "createdAt");
ALTER TABLE "CommunitySignalChallenge" ADD CONSTRAINT "CommunitySignalChallenge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunitySignalObservation" ADD CONSTRAINT "CommunitySignalObservation_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "CommunitySignalChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunitySignalObservation" ADD CONSTRAINT "CommunitySignalObservation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
