-- ACS Stage 1: durable cross-instance Stop AURA (not a consent SoT).

CREATE TABLE "programme_aura_stops" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "stoppedById" TEXT NOT NULL,
    "stoppedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "clearedAt" TIMESTAMP(3),
    "clearedById" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programme_aura_stops_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "programme_aura_stops_participantId_clearedAt_idx" ON "programme_aura_stops"("participantId", "clearedAt");
CREATE INDEX "programme_aura_stops_organisationId_clearedAt_idx" ON "programme_aura_stops"("organisationId", "clearedAt");

ALTER TABLE "programme_aura_stops" ADD CONSTRAINT "programme_aura_stops_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "programme_aura_stops" ADD CONSTRAINT "programme_aura_stops_stoppedById_fkey" FOREIGN KEY ("stoppedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "programme_aura_stops" ADD CONSTRAINT "programme_aura_stops_clearedById_fkey" FOREIGN KEY ("clearedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
