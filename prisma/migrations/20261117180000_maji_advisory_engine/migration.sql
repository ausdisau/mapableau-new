-- MAJI v0.1 advisory comparison records. Additive only; unused until flags are enabled.

CREATE TABLE "transport_journey_advice" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "preference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'pending',
    "evaluatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "actorUserId" TEXT,
    "explanation" TEXT NOT NULL,
    "provenanceJson" JSONB,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "idempotencyKey" TEXT NOT NULL,
    "advisoryOnly" BOOLEAN NOT NULL DEFAULT true,
    "bookingUnchanged" BOOLEAN NOT NULL DEFAULT true,
    "quoteUnchanged" BOOLEAN NOT NULL DEFAULT true,
    "acceptedQuoteTotalCents" INTEGER,
    "originKind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_journey_advice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "transport_journey_advice_idempotencyKey_key" ON "transport_journey_advice"("idempotencyKey");
CREATE INDEX "transport_journey_advice_tripId_evaluatedAt_idx" ON "transport_journey_advice"("tripId", "evaluatedAt");
CREATE INDEX "transport_journey_advice_tripId_expiresAt_idx" ON "transport_journey_advice"("tripId", "expiresAt");

ALTER TABLE "transport_journey_advice"
  ADD CONSTRAINT "transport_journey_advice_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "transport_journey_candidates" (
    "id" TEXT NOT NULL,
    "adviceId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "remainingDurationSeconds" INTEGER NOT NULL,
    "remainingDistanceMetres" INTEGER NOT NULL,
    "liveTrafficUsed" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "trafficMode" TEXT,
    "providerStatus" TEXT,
    "validUntil" TIMESTAMP(3),
    "estimatedArrivalAt" TIMESTAMP(3),
    "paidDriverTimeCents" INTEGER,
    "distanceCostCents" INTEGER,
    "energyAllowanceCents" INTEGER,
    "tollCents" INTEGER,
    "extraChargesCents" INTEGER,
    "totalRemainingCents" INTEGER,
    "operatingCostDifferenceCents" INTEGER,
    "timeSavingSeconds" INTEGER,
    "constraintJson" JSONB,
    "hazardEvidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_journey_candidates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transport_journey_candidates_adviceId_idx" ON "transport_journey_candidates"("adviceId");

ALTER TABLE "transport_journey_candidates"
  ADD CONSTRAINT "transport_journey_candidates_adviceId_fkey"
  FOREIGN KEY ("adviceId") REFERENCES "transport_journey_advice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
