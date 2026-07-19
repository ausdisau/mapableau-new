-- Access independence MVP: barrier reports + form drafts

CREATE TYPE "AccessBarrierCategory" AS ENUM (
  'entrance',
  'lift',
  'toilet',
  'parking_dropoff',
  'path_surface',
  'signage',
  'communication',
  'sensory_environment',
  'website_booking',
  'staff_service_process',
  'incorrect_mapable_information',
  'other'
);

CREATE TYPE "AccessBarrierUrgency" AS ENUM (
  'low',
  'standard',
  'high',
  'safety_critical'
);

CREATE TYPE "AccessBarrierReportStatus" AS ENUM (
  'draft',
  'received',
  'reviewing',
  'actioned',
  'closed'
);

CREATE TABLE "AccessBarrierReport" (
  "id" TEXT NOT NULL,
  "referenceNumber" TEXT NOT NULL,
  "reporterUserId" TEXT,
  "placeId" TEXT,
  "placeSlug" TEXT,
  "placeName" TEXT,
  "serviceId" TEXT,
  "category" "AccessBarrierCategory" NOT NULL,
  "description" TEXT NOT NULL,
  "locationDetail" TEXT,
  "urgency" "AccessBarrierUrgency" NOT NULL DEFAULT 'standard',
  "observedAt" TIMESTAMP(3),
  "imageUrl" TEXT,
  "imageDescription" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "anonymous" BOOLEAN NOT NULL DEFAULT false,
  "consentToContact" BOOLEAN NOT NULL DEFAULT false,
  "status" "AccessBarrierReportStatus" NOT NULL DEFAULT 'received',
  "isDraft" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AccessBarrierReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccessBarrierReport_referenceNumber_key" ON "AccessBarrierReport"("referenceNumber");
CREATE INDEX "AccessBarrierReport_reporterUserId_status_idx" ON "AccessBarrierReport"("reporterUserId", "status");
CREATE INDEX "AccessBarrierReport_placeSlug_idx" ON "AccessBarrierReport"("placeSlug");
CREATE INDEX "AccessBarrierReport_status_createdAt_idx" ON "AccessBarrierReport"("status", "createdAt");

ALTER TABLE "AccessBarrierReport"
  ADD CONSTRAINT "AccessBarrierReport_reporterUserId_fkey"
  FOREIGN KEY ("reporterUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "FormDraft" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workflowKey" TEXT NOT NULL,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "stepId" TEXT,
  "payload" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FormDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FormDraft_userId_workflowKey_key" ON "FormDraft"("userId", "workflowKey");
CREATE INDEX "FormDraft_expiresAt_idx" ON "FormDraft"("expiresAt");

ALTER TABLE "FormDraft"
  ADD CONSTRAINT "FormDraft_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
