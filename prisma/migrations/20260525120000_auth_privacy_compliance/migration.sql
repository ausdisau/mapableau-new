-- Auth0 identity bridge, privacy, and compliance tables

CREATE TYPE "AuthProvider" AS ENUM ('auth0', 'google', 'credentials');
CREATE TYPE "AuthLoginEventType" AS ENUM ('login', 'logout', 'login_failed', 'callback', 'link_account');
CREATE TYPE "AuthSecurityEventType" AS ENUM ('account_link_requested', 'account_link_confirmed', 'account_link_rejected', 'step_up_required', 'step_up_verified', 'step_up_failed', 'mfa_challenge', 'lockout');
CREATE TYPE "ProfileOnboardingStatusEnum" AS ENUM ('pending_role', 'pending_privacy_consent', 'pending_approval', 'complete');
CREATE TYPE "ProfileRoleStatus" AS ENUM ('requested', 'pending_approval', 'approved', 'rejected');
CREATE TYPE "ConsentGrantType" AS ENUM ('privacy_policy', 'terms_of_service', 'data_collection', 'marketing');
CREATE TYPE "ConsentGrantStatus" AS ENUM ('granted', 'revoked');
CREATE TYPE "DataClassification" AS ENUM ('identity_data', 'personal_information', 'sensitive_information', 'health_information', 'ephi_possible');
CREATE TYPE "AustralianPrivacyReviewStatus" AS ENUM ('not_reviewed', 'in_review', 'approved', 'requires_action');

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE TABLE "auth_identity_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "auth0UserId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL DEFAULT 'auth0',
    "providerUserId" TEXT,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMPTZ,
    CONSTRAINT "auth_identity_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_identity_links_auth0UserId_key" ON "auth_identity_links"("auth0UserId");
CREATE INDEX "auth_identity_links_userId_idx" ON "auth_identity_links"("userId");
CREATE INDEX "auth_identity_links_email_idx" ON "auth_identity_links"("email");

ALTER TABLE "auth_identity_links" ADD CONSTRAINT "auth_identity_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "auth_login_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "auth0UserId" TEXT,
    "provider" "AuthProvider",
    "eventType" "AuthLoginEventType" NOT NULL,
    "ipAddressHash" TEXT,
    "userAgentHash" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "riskLevel" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_login_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auth_login_events_userId_createdAt_idx" ON "auth_login_events"("userId", "createdAt");
CREATE INDEX "auth_login_events_auth0UserId_createdAt_idx" ON "auth_login_events"("auth0UserId", "createdAt");

ALTER TABLE "auth_login_events" ADD CONSTRAINT "auth_login_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "auth_security_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "auth0UserId" TEXT,
    "eventType" "AuthSecurityEventType" NOT NULL,
    "metadata" JSONB,
    "ipAddressHash" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_security_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auth_security_events_userId_createdAt_idx" ON "auth_security_events"("userId", "createdAt");

ALTER TABLE "auth_security_events" ADD CONSTRAINT "auth_security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "auth_step_up_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "verifiedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "auth_step_up_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auth_step_up_challenges_userId_actionKey_expiresAt_idx" ON "auth_step_up_challenges"("userId", "actionKey", "expiresAt");

ALTER TABLE "auth_step_up_challenges" ADD CONSTRAINT "auth_step_up_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "profile_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MapAbleUserRole" NOT NULL,
    "status" "ProfileRoleStatus" NOT NULL DEFAULT 'requested',
    "requestedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMPTZ,
    "approvedById" TEXT,
    CONSTRAINT "profile_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profile_roles_userId_role_key" ON "profile_roles"("userId", "role");
CREATE INDEX "profile_roles_userId_status_idx" ON "profile_roles"("userId", "status");

ALTER TABLE "profile_roles" ADD CONSTRAINT "profile_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "profile_onboarding_status" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ProfileOnboardingStatusEnum" NOT NULL DEFAULT 'pending_role',
    "roleSelected" "MapAbleUserRole",
    "privacyConsentAt" TIMESTAMPTZ,
    "approvedAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profile_onboarding_status_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profile_onboarding_status_userId_key" ON "profile_onboarding_status"("userId");

ALTER TABLE "profile_onboarding_status" ADD CONSTRAINT "profile_onboarding_status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "consent_grants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantType" "ConsentGrantType" NOT NULL,
    "status" "ConsentGrantStatus" NOT NULL DEFAULT 'granted',
    "purpose" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "grantedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ,
    CONSTRAINT "consent_grants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consent_grants_userId_grantType_status_idx" ON "consent_grants"("userId", "grantType", "status");

ALTER TABLE "consent_grants" ADD CONSTRAINT "consent_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "consent_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantId" TEXT,
    "eventType" TEXT NOT NULL,
    "grantType" "ConsentGrantType",
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consent_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consent_events_userId_createdAt_idx" ON "consent_events"("userId", "createdAt");

ALTER TABLE "consent_events" ADD CONSTRAINT "consent_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddressHash" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_category_createdAt_idx" ON "audit_logs"("category", "createdAt");
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "data_access_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "subjectUserId" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "classification" "DataClassification" NOT NULL,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "data_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "data_access_logs_actorUserId_createdAt_idx" ON "data_access_logs"("actorUserId", "createdAt");
CREATE INDEX "data_access_logs_subjectUserId_createdAt_idx" ON "data_access_logs"("subjectUserId", "createdAt");

ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "vendor_compliance_records" (
    "id" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "dataCategories" TEXT[],
    "handlesPhiOrEphi" BOOLEAN NOT NULL DEFAULT false,
    "handlesHealthInformation" BOOLEAN NOT NULL DEFAULT false,
    "baaRequired" BOOLEAN NOT NULL DEFAULT false,
    "baaSigned" BOOLEAN NOT NULL DEFAULT false,
    "australianPrivacyReviewStatus" "AustralianPrivacyReviewStatus" NOT NULL DEFAULT 'not_reviewed',
    "subprocessorsReviewed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "reviewedAt" TIMESTAMPTZ,
    "nextReviewAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "vendor_compliance_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vendor_compliance_records_vendorName_serviceName_key" ON "vendor_compliance_records"("vendorName", "serviceName");
