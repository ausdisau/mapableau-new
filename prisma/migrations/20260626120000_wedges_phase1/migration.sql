-- MapAble Strategic Wedges Phase 1

CREATE TABLE "provider_availability_snapshots" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "providerProfileId" TEXT,
    "acceptingNewParticipants" BOOLEAN NOT NULL DEFAULT false,
    "waitlistStatus" TEXT NOT NULL DEFAULT 'unknown',
    "earliestStartDate" TIMESTAMP(3),
    "availableDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "afterHoursAvailable" BOOLEAN NOT NULL DEFAULT false,
    "weekendAvailable" BOOLEAN NOT NULL DEFAULT false,
    "telehealthAvailable" BOOLEAN NOT NULL DEFAULT false,
    "mobileServiceAvailable" BOOLEAN NOT NULL DEFAULT false,
    "suburbsServed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fundingTypesAccepted" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "urgentCapacity" BOOLEAN NOT NULL DEFAULT false,
    "lastAvailabilityUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availabilityConfidence" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_availability_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_access_capability_records" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "providerProfileId" TEXT,
    "stepFreeEntry" BOOLEAN,
    "doorWidthMm" INTEGER,
    "accessibleToilet" BOOLEAN,
    "accessibleParking" BOOLEAN,
    "dropOffPoint" TEXT,
    "publicTransportNearby" BOOLEAN,
    "lowSensoryOption" BOOLEAN,
    "hearingLoop" BOOLEAN,
    "auslanAvailable" BOOLEAN,
    "aacFriendly" BOOLEAN,
    "plainLanguageMaterials" BOOLEAN,
    "telehealthAvailable" BOOLEAN,
    "homeVisitsAvailable" BOOLEAN,
    "assistanceAnimalPolicy" TEXT,
    "staffDisabilityTraining" BOOLEAN,
    "photosAvailable" BOOLEAN NOT NULL DEFAULT false,
    "measurementsAvailable" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "verificationSource" TEXT NOT NULL DEFAULT 'unknown',
    "capabilitiesJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_access_capability_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_concierge_requests" (
    "id" TEXT NOT NULL,
    "requesterRole" TEXT NOT NULL,
    "supportCategory" TEXT NOT NULL,
    "locationPostcode" TEXT NOT NULL,
    "locationSuburb" TEXT NOT NULL,
    "serviceMode" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "accessNeeds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fundingType" TEXT NOT NULL,
    "previousIssues" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "summaryJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_concierge_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "provider_availability_snapshots_organisationId_idx" ON "provider_availability_snapshots"("organisationId");
CREATE INDEX "provider_availability_snapshots_providerProfileId_idx" ON "provider_availability_snapshots"("providerProfileId");
CREATE INDEX "provider_availability_snapshots_acceptingNewParticipants_idx" ON "provider_availability_snapshots"("acceptingNewParticipants");
CREATE INDEX "provider_availability_snapshots_waitlistStatus_idx" ON "provider_availability_snapshots"("waitlistStatus");

CREATE INDEX "provider_access_capability_records_organisationId_idx" ON "provider_access_capability_records"("organisationId");
CREATE INDEX "provider_access_capability_records_providerProfileId_idx" ON "provider_access_capability_records"("providerProfileId");

CREATE INDEX "support_concierge_requests_userId_idx" ON "support_concierge_requests"("userId");
CREATE INDEX "support_concierge_requests_status_idx" ON "support_concierge_requests"("status");
CREATE INDEX "support_concierge_requests_locationPostcode_idx" ON "support_concierge_requests"("locationPostcode");

ALTER TABLE "support_concierge_requests" ADD CONSTRAINT "support_concierge_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
