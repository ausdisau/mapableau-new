-- Registration & role onboarding (MapAble)

CREATE TYPE "OnboardingFlowStatus" AS ENUM (
  'not_started',
  'in_progress',
  'submitted',
  'complete',
  'needs_review'
);

CREATE TYPE "ProfileRoleLinkStatus" AS ENUM (
  'pending',
  'active',
  'suspended',
  'rejected'
);

CREATE TYPE "ServiceEligibilityStatus" AS ENUM (
  'onboarding_incomplete',
  'submitted',
  'needs_review',
  'listed',
  'verified',
  'booking_eligible',
  'matching_eligible',
  'dispatch_eligible',
  'not_eligible'
);

-- Extend role enum for allied health
ALTER TYPE "MapAbleUserRole" ADD VALUE IF NOT EXISTS 'allied_health_practitioner';

CREATE TABLE "ProfileOnboardingStatus" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "selectedRole" TEXT,
  "onboardingStatus" "OnboardingFlowStatus" NOT NULL DEFAULT 'not_started',
  "completedSteps" JSONB NOT NULL DEFAULT '[]',
  "nextStep" TEXT,
  "eligibilityStatus" "ServiceEligibilityStatus" NOT NULL DEFAULT 'onboarding_incomplete',
  "roleDataJson" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfileOnboardingStatus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileOnboardingStatus_userId_key" ON "ProfileOnboardingStatus"("userId");
CREATE INDEX "ProfileOnboardingStatus_onboardingStatus_idx" ON "ProfileOnboardingStatus"("onboardingStatus");

CREATE TABLE "RegistrationConsent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "consentType" TEXT NOT NULL,
  "accepted" BOOLEAN NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegistrationConsent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistrationConsent_userId_idx" ON "RegistrationConsent"("userId");
CREATE UNIQUE INDEX "RegistrationConsent_userId_consentType_key" ON "RegistrationConsent"("userId", "consentType");

CREATE TABLE "OnboardingEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT,
  "eventType" TEXT NOT NULL,
  "actorId" TEXT,
  "payloadJson" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OnboardingEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OnboardingEvent_userId_idx" ON "OnboardingEvent"("userId");
CREATE INDEX "OnboardingEvent_eventType_idx" ON "OnboardingEvent"("eventType");

CREATE TABLE "NomineeOnboardingProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "relationshipToParticipant" TEXT NOT NULL,
  "authorityType" TEXT NOT NULL,
  "participantLinkMethod" TEXT,
  "permissionScopes" JSONB NOT NULL DEFAULT '[]',
  "proofRequired" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NomineeOnboardingProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NomineeOnboardingProfile_userId_key" ON "NomineeOnboardingProfile"("userId");

CREATE TABLE "AlliedHealthOnboardingProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profession" TEXT NOT NULL,
  "qualificationsSummary" TEXT NOT NULL,
  "ahpraRegistrationNumber" TEXT,
  "professionalBody" TEXT,
  "deliveryModes" JSONB NOT NULL DEFAULT '[]',
  "serviceRegions" JSONB NOT NULL DEFAULT '[]',
  "clinicalBookingEligibilityStatus" "ServiceEligibilityStatus" NOT NULL DEFAULT 'onboarding_incomplete',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AlliedHealthOnboardingProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AlliedHealthOnboardingProfile_userId_key" ON "AlliedHealthOnboardingProfile"("userId");

CREATE TABLE "PlanManagerOnboardingProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organisationName" TEXT NOT NULL,
  "abnOrNzbn" TEXT NOT NULL,
  "primaryContactName" TEXT NOT NULL,
  "invoiceReceivingEmail" TEXT NOT NULL,
  "paymentProcessingContact" TEXT,
  "planManagementRegistrationDetails" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlanManagerOnboardingProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlanManagerOnboardingProfile_userId_key" ON "PlanManagerOnboardingProfile"("userId");

CREATE TABLE "EmployerOnboardingProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organisationName" TEXT NOT NULL,
  "abnOrNzbn" TEXT NOT NULL,
  "contactPerson" TEXT NOT NULL,
  "contactRole" TEXT NOT NULL,
  "industry" TEXT NOT NULL,
  "locations" JSONB NOT NULL DEFAULT '[]',
  "website" TEXT,
  "inclusiveHiringCommitment" TEXT NOT NULL,
  "workplaceAccessibilitySummary" TEXT NOT NULL,
  "jobPostingPermissionStatus" "ServiceEligibilityStatus" NOT NULL DEFAULT 'onboarding_incomplete',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployerOnboardingProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmployerOnboardingProfile_userId_key" ON "EmployerOnboardingProfile"("userId");

ALTER TABLE "ProfileOnboardingStatus" ADD CONSTRAINT "ProfileOnboardingStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RegistrationConsent" ADD CONSTRAINT "RegistrationConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OnboardingEvent" ADD CONSTRAINT "OnboardingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NomineeOnboardingProfile" ADD CONSTRAINT "NomineeOnboardingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlliedHealthOnboardingProfile" ADD CONSTRAINT "AlliedHealthOnboardingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanManagerOnboardingProfile" ADD CONSTRAINT "PlanManagerOnboardingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployerOnboardingProfile" ADD CONSTRAINT "EmployerOnboardingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
