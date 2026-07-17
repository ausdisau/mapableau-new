-- Wave 17: Inclusive life planner and community participation.
-- Forward-only extension from Wave 13. Existing participation_goals rows remain valid.

ALTER TYPE "ParticipationGoalStatus" ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE "ParticipationGoalStatus" ADD VALUE IF NOT EXISTS 'clarifying';
ALTER TYPE "ParticipationGoalStatus" ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE "ParticipationGoalStatus" ADD VALUE IF NOT EXISTS 'paused';
ALTER TYPE "ParticipationGoalStatus" ADD VALUE IF NOT EXISTS 'achieved';
ALTER TYPE "ParticipationGoalStatus" ADD VALUE IF NOT EXISTS 'partially_achieved';
ALTER TYPE "ParticipationGoalStatus" ADD VALUE IF NOT EXISTS 'changed';
ALTER TYPE "ParticipationGoalStatus" ADD VALUE IF NOT EXISTS 'abandoned';
ALTER TYPE "ParticipationGoalStatus" ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE "ParticipationGoalStatus" ADD VALUE IF NOT EXISTS 'archived';

CREATE TYPE "ParticipationDomain" AS ENUM (
  'recreation',
  'sport',
  'arts',
  'culture',
  'music',
  'faith',
  'volunteering',
  'education',
  'training',
  'employment',
  'advocacy',
  'civic',
  'peer_support',
  'social',
  'travel',
  'online',
  'health_and_wellbeing',
  'participant_defined',
  'other'
);

CREATE TYPE "OpportunityStatus" AS ENUM (
  'draft',
  'pending_review',
  'published',
  'hidden',
  'suspended',
  'expired',
  'archived'
);

CREATE TYPE "ParticipationPlanStatus" AS ENUM (
  'draft',
  'simulated',
  'awaiting_approval',
  'approved',
  'executing',
  'completed',
  'cancelled',
  'paused'
);

CREATE TYPE "ParticipationPrivacyLevel" AS ENUM (
  'private',
  'household',
  'authorised_support',
  'organisation_minimum',
  'public_listing_safe'
);

CREATE TYPE "OpportunityDeliveryMode" AS ENUM ('in_person', 'online', 'hybrid');

CREATE TYPE "CommunityOrganisationType" AS ENUM (
  'community_group',
  'charity',
  'council',
  'faith',
  'arts',
  'sport',
  'education',
  'employer',
  'peer_network',
  'other'
);

CREATE TYPE "CommunityOrganisationVerificationStatus" AS ENUM (
  'unverified',
  'pending',
  'verified',
  'disputed',
  'suspended'
);

ALTER TABLE "participation_goals" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "participation_goals" ADD COLUMN "participantWording" TEXT;
ALTER TABLE "participation_goals" ADD COLUMN "interpretedSummary" TEXT;
ALTER TABLE "participation_goals" ADD COLUMN "domain" "ParticipationDomain";
ALTER TABLE "participation_goals" ADD COLUMN "desiredExperience" TEXT;
ALTER TABLE "participation_goals" ADD COLUMN "successDescription" TEXT;
ALTER TABLE "participation_goals" ADD COLUMN "boundaries" JSONB;
ALTER TABLE "participation_goals" ADD COLUMN "constraints" JSONB;
ALTER TABLE "participation_goals" ADD COLUMN "privacyLevel" "ParticipationPrivacyLevel" NOT NULL DEFAULT 'private';
ALTER TABLE "participation_goals" ADD COLUMN "startsAt" TIMESTAMP(3);
ALTER TABLE "participation_goals" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "participation_goals" ADD COLUMN "confirmedAt" TIMESTAMP(3);

CREATE INDEX "participation_goals_tenantId_status_idx" ON "participation_goals"("tenantId", "status");
CREATE INDEX "participation_goals_domain_idx" ON "participation_goals"("domain");

CREATE TABLE "participation_preferences" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "goalId" TEXT,
  "domain" "ParticipationDomain",
  "preferenceKey" TEXT NOT NULL,
  "preference" JSONB NOT NULL,
  "privacyLevel" "ParticipationPrivacyLevel" NOT NULL DEFAULT 'private',
  "source" TEXT NOT NULL DEFAULT 'participant',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "participation_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "participation_boundaries" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "goalId" TEXT,
  "boundaryType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "privacyLevel" "ParticipationPrivacyLevel" NOT NULL DEFAULT 'private',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "participation_boundaries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_organisations" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "name" TEXT NOT NULL,
  "organisationType" "CommunityOrganisationType" NOT NULL,
  "description" TEXT,
  "website" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "locationReference" TEXT,
  "verificationStatus" "CommunityOrganisationVerificationStatus" NOT NULL DEFAULT 'unverified',
  "sourceReference" TEXT,
  "sourceUpdatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "community_organisations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "participation_opportunities" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "venueId" TEXT,
  "accessPlaceId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "domain" "ParticipationDomain" NOT NULL,
  "opportunityType" TEXT NOT NULL,
  "costDescription" TEXT,
  "priceCents" INTEGER,
  "fundingClaims" TEXT,
  "ageRestrictions" TEXT,
  "eligibilityDescription" TEXT,
  "deliveryMode" "OpportunityDeliveryMode" NOT NULL,
  "locationReference" TEXT,
  "onlineLocationReference" TEXT,
  "accessProfileId" TEXT,
  "moderationStatus" TEXT NOT NULL DEFAULT 'pending',
  "sourceReference" TEXT NOT NULL,
  "sourceUpdatedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "status" "OpportunityStatus" NOT NULL DEFAULT 'draft',
  "sponsored" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "participation_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_events" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT,
  "organisationId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "domain" "ParticipationDomain" NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
  "deliveryMode" "OpportunityDeliveryMode" NOT NULL,
  "venueId" TEXT,
  "accessPlaceId" TEXT,
  "locationReference" TEXT,
  "onlineLocationReference" TEXT,
  "costDescription" TEXT,
  "priceCents" INTEGER,
  "moderationStatus" TEXT NOT NULL DEFAULT 'pending',
  "sourceReference" TEXT NOT NULL,
  "sourceUpdatedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "status" "OpportunityStatus" NOT NULL DEFAULT 'draft',
  "sponsored" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "community_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "participation_event_access_profiles" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "mobilityAccess" JSONB,
  "sensoryAccess" JSONB,
  "communicationAccess" JSONB,
  "transportAccess" JSONB,
  "supportAccess" JSONB,
  "toiletAccess" JSONB,
  "quietSpace" JSONB,
  "dietaryAccess" JSONB,
  "evidenceLevel" TEXT NOT NULL,
  "lastCheckedAt" TIMESTAMP(3) NOT NULL,
  "validUntil" TIMESTAMP(3),
  "uncertainty" TEXT,
  "accessAssetIds" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "participation_event_access_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "participation_plans" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "goalId" TEXT,
  "opportunityId" TEXT,
  "eventId" TEXT,
  "title" TEXT NOT NULL,
  "status" "ParticipationPlanStatus" NOT NULL DEFAULT 'draft',
  "privacyLevel" "ParticipationPrivacyLevel" NOT NULL DEFAULT 'private',
  "consentDirectiveIds" JSONB NOT NULL DEFAULT '[]',
  "calendarEventId" TEXT,
  "bookingId" TEXT,
  "accessJourneyPlanId" TEXT,
  "supportAllocationNote" TEXT,
  "participantNotes" TEXT,
  "approvedAt" TIMESTAMP(3),
  "executedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "participation_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "participation_plan_steps" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "stepType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" "ParticipationPlanStatus" NOT NULL DEFAULT 'draft',
  "calendarEventId" TEXT,
  "bookingId" TEXT,
  "accessJourneyPlanId" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "participation_plan_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "participation_reflections" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "planId" TEXT,
  "goalId" TEXT,
  "opportunityId" TEXT,
  "eventId" TEXT,
  "body" TEXT NOT NULL,
  "mood" TEXT,
  "privacyLevel" "ParticipationPrivacyLevel" NOT NULL DEFAULT 'private',
  "organiserNotes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "participation_reflections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "participation_preferences_participantId_active_idx" ON "participation_preferences"("participantId", "active");
CREATE INDEX "participation_preferences_goalId_idx" ON "participation_preferences"("goalId");
CREATE INDEX "participation_preferences_domain_idx" ON "participation_preferences"("domain");
CREATE INDEX "participation_boundaries_participantId_active_idx" ON "participation_boundaries"("participantId", "active");
CREATE INDEX "participation_boundaries_goalId_idx" ON "participation_boundaries"("goalId");
CREATE INDEX "community_organisations_tenantId_verificationStatus_idx" ON "community_organisations"("tenantId", "verificationStatus");
CREATE INDEX "community_organisations_organisationType_idx" ON "community_organisations"("organisationType");
CREATE INDEX "participation_opportunities_organisationId_status_idx" ON "participation_opportunities"("organisationId", "status");
CREATE INDEX "participation_opportunities_domain_status_idx" ON "participation_opportunities"("domain", "status");
CREATE INDEX "participation_opportunities_accessPlaceId_idx" ON "participation_opportunities"("accessPlaceId");
CREATE INDEX "participation_opportunities_sponsored_idx" ON "participation_opportunities"("sponsored");
CREATE INDEX "community_events_organisationId_status_idx" ON "community_events"("organisationId", "status");
CREATE INDEX "community_events_opportunityId_idx" ON "community_events"("opportunityId");
CREATE INDEX "community_events_domain_startsAt_idx" ON "community_events"("domain", "startsAt");
CREATE INDEX "community_events_accessPlaceId_idx" ON "community_events"("accessPlaceId");
CREATE UNIQUE INDEX "participation_event_access_profiles_eventId_key" ON "participation_event_access_profiles"("eventId");
CREATE INDEX "participation_event_access_profiles_lastCheckedAt_idx" ON "participation_event_access_profiles"("lastCheckedAt");
CREATE INDEX "participation_event_access_profiles_validUntil_idx" ON "participation_event_access_profiles"("validUntil");
CREATE INDEX "participation_plans_participantId_status_idx" ON "participation_plans"("participantId", "status");
CREATE INDEX "participation_plans_goalId_idx" ON "participation_plans"("goalId");
CREATE INDEX "participation_plans_opportunityId_idx" ON "participation_plans"("opportunityId");
CREATE INDEX "participation_plans_eventId_idx" ON "participation_plans"("eventId");
CREATE INDEX "participation_plan_steps_planId_sortOrder_idx" ON "participation_plan_steps"("planId", "sortOrder");
CREATE INDEX "participation_reflections_participantId_createdAt_idx" ON "participation_reflections"("participantId", "createdAt");
CREATE INDEX "participation_reflections_planId_idx" ON "participation_reflections"("planId");

ALTER TABLE "participation_preferences" ADD CONSTRAINT "participation_preferences_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "participation_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "participation_boundaries" ADD CONSTRAINT "participation_boundaries_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "participation_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "participation_opportunities" ADD CONSTRAINT "participation_opportunities_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "community_organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "community_events" ADD CONSTRAINT "community_events_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "participation_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "community_events" ADD CONSTRAINT "community_events_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "community_organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "participation_event_access_profiles" ADD CONSTRAINT "participation_event_access_profiles_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "community_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participation_plans" ADD CONSTRAINT "participation_plans_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "participation_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "participation_plans" ADD CONSTRAINT "participation_plans_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "participation_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "participation_plans" ADD CONSTRAINT "participation_plans_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "community_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "participation_plan_steps" ADD CONSTRAINT "participation_plan_steps_planId_fkey" FOREIGN KEY ("planId") REFERENCES "participation_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participation_reflections" ADD CONSTRAINT "participation_reflections_planId_fkey" FOREIGN KEY ("planId") REFERENCES "participation_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
