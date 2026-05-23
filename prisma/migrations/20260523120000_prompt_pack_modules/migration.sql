-- Prompt-pack module tables

CREATE TYPE "BundleStatus" AS ENUM ('draft', 'quoted', 'requested', 'awaiting_confirmation', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "BundleSegmentType" AS ENUM ('care_preparation', 'transport_outbound', 'care_at_destination', 'transport_return', 'care_post_arrival');

CREATE TABLE "BookingBundle" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "BundleStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT,
    "notes" TEXT,
    "quotedTotalCents" INTEGER,
    "careRequestId" TEXT,
    "bookingId" TEXT,
    "createdById" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookingBundle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BundleServiceSegment" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "segmentType" "BundleSegmentType" NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
    "careShiftId" TEXT,
    "transportBookingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    CONSTRAINT "BundleServiceSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BundleEvent" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BundleEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderServiceRegion" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "postcodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suburbs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "geoJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderServiceRegion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParticipantSupportGoal" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ParticipantSupportGoal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParticipantWorkerPreference" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "workerUserId" TEXT NOT NULL,
    "preferenceType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParticipantWorkerPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ParticipantWorkerPreference_participantId_workerUserId_preferenceType_key" ON "ParticipantWorkerPreference"("participantId", "workerUserId", "preferenceType");

CREATE TABLE "CoordinatorReferral" (
    "id" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "providerOrgId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CoordinatorReferral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoordinatorReferralEvent" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoordinatorReferralEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AtMarketplaceListing" (
    "id" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "listingType" TEXT NOT NULL,
    "category" TEXT,
    "priceCents" INTEGER,
    "conditionNotes" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "ndisNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AtMarketplaceListing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisPlanUpload" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "extractionJson" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NdisPlanUpload_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntakeSession" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'chat',
    "status" TEXT NOT NULL DEFAULT 'open',
    "extractionJson" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IntakeSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntakeMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntakeMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodOrder" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalCents" INTEGER,
    "allergyAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "deliveryNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FoodOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlliedHealthAppointment" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "therapistId" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'in_person',
    "status" TEXT NOT NULL DEFAULT 'requested',
    "scheduledStart" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlliedHealthAppointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FamilyProfile" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FamilyProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "familyProfileId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "birthYear" INTEGER,
    "privacyLevel" TEXT NOT NULL DEFAULT 'private',
    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgedCareProfile" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "intakeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgedCareProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgedCareProfile_participantId_key" ON "AgedCareProfile"("participantId");

CREATE TABLE "TourismItinerary" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "itemsJson" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TourismItinerary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LensUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT,
    "storageKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LensUpload_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LensReviewTask" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observationJson" JSONB,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "LensReviewTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedAccessibleRoute" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originLabel" TEXT NOT NULL,
    "destinationLabel" TEXT NOT NULL,
    "routeJson" JSONB NOT NULL,
    "confidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedAccessibleRoute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComplianceReviewRun" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "moduleScope" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceReviewRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComplianceReviewFinding" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "module" TEXT,
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    CONSTRAINT "ComplianceReviewFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DirectoryQuoteRequest" (
    "id" TEXT NOT NULL,
    "directoryProviderId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DirectoryQuoteRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingBundle_participantId_status_idx" ON "BookingBundle"("participantId", "status");
CREATE INDEX "BundleServiceSegment_bundleId_sequenceOrder_idx" ON "BundleServiceSegment"("bundleId", "sequenceOrder");
CREATE INDEX "BundleEvent_bundleId_createdAt_idx" ON "BundleEvent"("bundleId", "createdAt");
CREATE INDEX "ProviderServiceRegion_organisationId_idx" ON "ProviderServiceRegion"("organisationId");
CREATE INDEX "ParticipantSupportGoal_participantId_idx" ON "ParticipantSupportGoal"("participantId");
CREATE INDEX "CoordinatorReferral_coordinatorId_status_idx" ON "CoordinatorReferral"("coordinatorId", "status");
CREATE INDEX "AtMarketplaceListing_status_category_idx" ON "AtMarketplaceListing"("status", "category");

ALTER TABLE "BundleServiceSegment" ADD CONSTRAINT "BundleServiceSegment_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "BookingBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BundleEvent" ADD CONSTRAINT "BundleEvent_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "BookingBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoordinatorReferralEvent" ADD CONSTRAINT "CoordinatorReferralEvent_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "CoordinatorReferral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntakeMessage" ADD CONSTRAINT "IntakeMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LensReviewTask" ADD CONSTRAINT "LensReviewTask_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "LensUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplianceReviewFinding" ADD CONSTRAINT "ComplianceReviewFinding_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ComplianceReviewRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
