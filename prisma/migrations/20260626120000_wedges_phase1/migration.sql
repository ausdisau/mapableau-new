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

    CONSTRAINT "provider_availability_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "provider_availability_waitlist_status_check"
      CHECK ("waitlistStatus" IN ('none', 'short', 'medium', 'long', 'closed', 'unknown')),
    CONSTRAINT "provider_availability_confidence_check"
      CHECK ("availabilityConfidence" IN ('high', 'medium', 'low', 'unknown')),
    CONSTRAINT "provider_availability_funding_types_check"
      CHECK ("fundingTypesAccepted" <@ ARRAY['agency-managed', 'plan-managed', 'self-managed', 'private']::TEXT[])
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

    CONSTRAINT "provider_access_capability_records_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "provider_access_verification_source_check"
      CHECK ("verificationSource" IN ('provider-declared', 'community-checked', 'mapable-assessed', 'unknown'))
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

    CONSTRAINT "support_concierge_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "support_concierge_requester_role_check"
      CHECK ("requesterRole" IN ('participant', 'family_carer', 'support_coordinator', 'provider_on_behalf', 'other')),
    CONSTRAINT "support_concierge_category_check"
      CHECK ("supportCategory" IN ('therapy', 'support_worker', 'support_coordination', 'transport', 'employment_support', 'home_support', 'community_participation', 'other')),
    CONSTRAINT "support_concierge_service_mode_check"
      CHECK ("serviceMode" IN ('in_person', 'mobile_home_visit', 'telehealth', 'flexible')),
    CONSTRAINT "support_concierge_urgency_check"
      CHECK ("urgency" IN ('this_week', 'this_month', 'no_rush', 'unsure')),
    CONSTRAINT "support_concierge_funding_type_check"
      CHECK ("fundingType" IN ('agency-managed', 'plan-managed', 'self-managed', 'private', 'unsure')),
    CONSTRAINT "support_concierge_postcode_check"
      CHECK ("locationPostcode" ~ '^[0-9]{4}$'),
    CONSTRAINT "support_concierge_consent_check"
      CHECK ("consentGiven" = true)
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

ALTER TABLE "support_concierge_requests"
  ADD CONSTRAINT "support_concierge_requests_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
