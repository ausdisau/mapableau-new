-- MapAble Transport MVP domain extensions

-- Orchestration event for TransportTrip Care bundle
ALTER TYPE "OrchestrationEventType" ADD VALUE IF NOT EXISTS 'care_transport_trip_link_created';

-- ConsentScope additions
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'transport_exact_location_share';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'transport_live_location';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'transport_access_profile_share';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'transport_delegate_booking';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'transport_evidence_share';

-- TransportTripStatus additions
ALTER TYPE "TransportTripStatus" ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE "TransportTripStatus" ADD VALUE IF NOT EXISTS 'quoting';
ALTER TYPE "TransportTripStatus" ADD VALUE IF NOT EXISTS 'quote_available';
ALTER TYPE "TransportTripStatus" ADD VALUE IF NOT EXISTS 'participant_confirmed';
ALTER TYPE "TransportTripStatus" ADD VALUE IF NOT EXISTS 'incident_hold';
ALTER TYPE "TransportTripStatus" ADD VALUE IF NOT EXISTS 'settled';

-- New enums
DO $$ BEGIN
  CREATE TYPE "TransportQuoteSource" AS ENUM ('operator', 'pricing_rule', 'partner_api', 'sandbox');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "TransportQuoteStatus" AS ENUM ('draft', 'offered', 'accepted', 'declined', 'expired', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "TransportAccessFitStatus" AS ENUM ('fit', 'fail', 'manual_review');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "TransportFundingDeclaredType" AS ENUM ('private_pay', 'self_managed', 'plan_managed', 'ndia_managed', 'other', 'unsure');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "TransportConsentScope" AS ENUM ('exact_location_share', 'live_location', 'access_profile_share', 'delegate_booking', 'evidence_share');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "TransportAttestationClaimType" AS ENUM ('quote_acceptance', 'assignment_eligibility_pass', 'prestart_pass', 'driver_completion', 'participant_confirmation', 'participant_dispute', 'pricing_rule_selection');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "transport_access_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mobilityDevices" JSONB NOT NULL DEFAULT '[]',
    "transferAbility" TEXT,
    "boardingMethod" JSONB NOT NULL DEFAULT '{}',
    "defaultAssistance" JSONB NOT NULL DEFAULT '{}',
    "communicationPrefs" JSONB NOT NULL DEFAULT '{}',
    "sensoryPrefs" JSONB NOT NULL DEFAULT '{}',
    "companionDefaults" JSONB NOT NULL DEFAULT '{}',
    "serviceAnimal" BOOLEAN NOT NULL DEFAULT false,
    "safePickupNotes" TEXT,
    "restrictedDriverNotes" TEXT,
    "profileVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_access_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "transport_access_profiles_userId_key" ON "transport_access_profiles"("userId");

CREATE TABLE IF NOT EXISTS "transport_locations" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "maskedLabel" TEXT NOT NULL,
    "suburb" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "coarseLat" DOUBLE PRECISION,
    "coarseLng" DOUBLE PRECISION,
    "encryptedAddressPayload" TEXT,
    "encryptedCoordinates" TEXT,
    "keyVersion" TEXT,
    "safeAccessNotes" TEXT,
    "restrictedDriverNotes" TEXT,
    "retainUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_locations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "transport_locations_ownerUserId_idx" ON "transport_locations"("ownerUserId");

CREATE TABLE IF NOT EXISTS "transport_pricing_rules" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'AU',
    "serviceType" TEXT NOT NULL,
    "supportItemCode" TEXT,
    "unit" TEXT NOT NULL,
    "rateCents" INTEGER,
    "capCents" INTEGER,
    "gstTreatment" TEXT NOT NULL,
    "cancellationRules" JSONB NOT NULL DEFAULT '{}',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "importedByUserId" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_pricing_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "transport_pricing_rules_versionId_key" ON "transport_pricing_rules"("versionId");
CREATE INDEX IF NOT EXISTS "transport_pricing_rules_jurisdiction_serviceType_active_idx" ON "transport_pricing_rules"("jurisdiction", "serviceType", "active");
CREATE INDEX IF NOT EXISTS "transport_pricing_rules_effectiveFrom_effectiveTo_idx" ON "transport_pricing_rules"("effectiveFrom", "effectiveTo");

CREATE TABLE IF NOT EXISTS "transport_quotes" (
    "id" TEXT NOT NULL,
    "tripRequestId" TEXT,
    "tripId" TEXT,
    "operatorOrganisationId" TEXT NOT NULL,
    "proposedDriverId" TEXT,
    "proposedVehicleId" TEXT,
    "quoteSource" "TransportQuoteSource" NOT NULL,
    "status" "TransportQuoteStatus" NOT NULL DEFAULT 'draft',
    "estimatedPickupStart" TIMESTAMP(3),
    "estimatedPickupEnd" TIMESTAMP(3),
    "estimatedDurationSeconds" INTEGER,
    "estimatedDistanceMetres" INTEGER,
    "fareBreakdownCents" JSONB NOT NULL DEFAULT '{}',
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "totalCents" INTEGER,
    "pricingRuleVersionId" TEXT,
    "accessFit" "TransportAccessFitStatus" NOT NULL DEFAULT 'manual_review',
    "accessFitReasons" JSONB NOT NULL DEFAULT '[]',
    "isEstimate" BOOLEAN NOT NULL DEFAULT true,
    "sandbox" BOOLEAN NOT NULL DEFAULT false,
    "validUntil" TIMESTAMP(3),
    "cancellationTermsRef" TEXT,
    "createdByUserId" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_quotes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "transport_quotes_idempotencyKey_key" ON "transport_quotes"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "transport_quotes_tripId_status_idx" ON "transport_quotes"("tripId", "status");
CREATE INDEX IF NOT EXISTS "transport_quotes_tripRequestId_status_idx" ON "transport_quotes"("tripRequestId", "status");
CREATE INDEX IF NOT EXISTS "transport_quotes_operatorOrganisationId_status_idx" ON "transport_quotes"("operatorOrganisationId", "status");

CREATE TABLE IF NOT EXISTS "transport_consents" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "scope" "TransportConsentScope" NOT NULL,
    "granteeType" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "transport_consents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "transport_consents_participantId_scope_idx" ON "transport_consents"("participantId", "scope");
CREATE INDEX IF NOT EXISTS "transport_consents_granteeType_granteeId_idx" ON "transport_consents"("granteeType", "granteeId");

CREATE TABLE IF NOT EXISTS "transport_attestations" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "actorUserId" TEXT,
    "claimType" "TransportAttestationClaimType" NOT NULL,
    "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
    "payloadHash" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "verificationStatus" TEXT NOT NULL DEFAULT 'recorded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_attestations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "transport_attestations_tripId_claimType_idx" ON "transport_attestations"("tripId", "claimType");

CREATE TABLE IF NOT EXISTS "transport_complaints" (
    "id" TEXT NOT NULL,
    "participantId" TEXT,
    "tripId" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'received',
    "acknowledgementDueAt" TIMESTAMP(3),
    "advocateInvolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_complaints_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "transport_complaints_participantId_status_idx" ON "transport_complaints"("participantId", "status");
CREATE INDEX IF NOT EXISTS "transport_complaints_tripId_idx" ON "transport_complaints"("tripId");

-- Trip columns
ALTER TABLE "transport_trips" ADD COLUMN IF NOT EXISTS "acceptedQuoteId" TEXT;
ALTER TABLE "transport_trips" ADD COLUMN IF NOT EXISTS "pickupLocationId" TEXT;
ALTER TABLE "transport_trips" ADD COLUMN IF NOT EXISTS "dropoffLocationId" TEXT;
ALTER TABLE "transport_trips" ADD COLUMN IF NOT EXISTS "actualStartAt" TIMESTAMP(3);
ALTER TABLE "transport_trips" ADD COLUMN IF NOT EXISTS "actualEndAt" TIMESTAMP(3);
ALTER TABLE "transport_trips" ADD COLUMN IF NOT EXISTS "actualDistanceMetres" INTEGER;
ALTER TABLE "transport_trips" ADD COLUMN IF NOT EXISTS "fundingContext" JSONB;
ALTER TABLE "transport_trips" ADD COLUMN IF NOT EXISTS "billingHold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "transport_trips" ADD COLUMN IF NOT EXISTS "billingHoldReason" TEXT;
ALTER TABLE "transport_trips" ADD COLUMN IF NOT EXISTS "participantConfirmedAt" TIMESTAMP(3);
ALTER TABLE "transport_trips" ADD COLUMN IF NOT EXISTS "operatorCompletedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "transport_trips_acceptedQuoteId_key" ON "transport_trips"("acceptedQuoteId");

-- Event columns
ALTER TABLE "transport_trip_events" ADD COLUMN IF NOT EXISTS "locationPrecision" TEXT;
ALTER TABLE "transport_trip_events" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "transport_trip_events" ADD COLUMN IF NOT EXISTS "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "transport_trip_events" ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "transport_trip_events_tripId_idempotencyKey_key" ON "transport_trip_events"("tripId", "idempotencyKey");

-- Assignment eligibility snapshot
ALTER TABLE "transport_dispatch_assignments" ADD COLUMN IF NOT EXISTS "eligibilitySnapshot" JSONB;
ALTER TABLE "transport_dispatch_assignments" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);
ALTER TABLE "transport_dispatch_assignments" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
ALTER TABLE "transport_dispatch_assignments" ADD COLUMN IF NOT EXISTS "revokeReason" TEXT;

-- FKs (best-effort; ignore if already present)
DO $$ BEGIN
  ALTER TABLE "transport_access_profiles" ADD CONSTRAINT "transport_access_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_locations" ADD CONSTRAINT "transport_locations_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_pricing_rules" ADD CONSTRAINT "transport_pricing_rules_importedByUserId_fkey" FOREIGN KEY ("importedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_quotes" ADD CONSTRAINT "transport_quotes_operatorOrganisationId_fkey" FOREIGN KEY ("operatorOrganisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_quotes" ADD CONSTRAINT "transport_quotes_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_quotes" ADD CONSTRAINT "transport_quotes_pricingRuleVersionId_fkey" FOREIGN KEY ("pricingRuleVersionId") REFERENCES "transport_pricing_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_quotes" ADD CONSTRAINT "transport_quotes_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_consents" ADD CONSTRAINT "transport_consents_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_attestations" ADD CONSTRAINT "transport_attestations_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_attestations" ADD CONSTRAINT "transport_attestations_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_complaints" ADD CONSTRAINT "transport_complaints_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_complaints" ADD CONSTRAINT "transport_complaints_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_acceptedQuoteId_fkey" FOREIGN KEY ("acceptedQuoteId") REFERENCES "transport_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "transport_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_dropoffLocationId_fkey" FOREIGN KEY ("dropoffLocationId") REFERENCES "transport_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
