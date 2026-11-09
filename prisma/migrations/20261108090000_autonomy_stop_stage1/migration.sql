-- ACS Stage 1 durable Stop. Not a consent source of truth.

CREATE TABLE "AutonomyStop" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "participantId" TEXT,
    "stoppedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedAt" TIMESTAMP(3),

    CONSTRAINT "AutonomyStop_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AutonomyStop_tenantId_clearedAt_idx" ON "AutonomyStop"("tenantId", "clearedAt");
CREATE INDEX "AutonomyStop_tenantId_participantId_clearedAt_idx" ON "AutonomyStop"("tenantId", "participantId", "clearedAt");

ALTER TABLE "AutonomyStop"
  ADD CONSTRAINT "AutonomyStop_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutonomyStop"
  ADD CONSTRAINT "AutonomyStop_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutonomyStop"
  ADD CONSTRAINT "AutonomyStop_stoppedById_fkey"
  FOREIGN KEY ("stoppedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
