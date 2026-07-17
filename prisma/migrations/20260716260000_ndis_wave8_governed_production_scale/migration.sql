-- NDIS Wave 8: governed multi-organisation production scale.
-- Forward-only. Extends Organisation with tenant lifecycle fields.
-- Feature flags / env vars are NOT entitlements or production approval.
-- AI must not approve GA, onboarding, break-glass, or regulatory interpretation.

-- ============================================================================
-- Enums
-- ============================================================================

CREATE TYPE "TenantStatus" AS ENUM (
  'prospective', 'onboarding', 'active_limited', 'active',
  'restricted', 'suspended', 'offboarding', 'archived'
);

CREATE TYPE "TenantType" AS ENUM (
  'registered_provider', 'unregistered_provider', 'plan_manager',
  'support_coordinator', 'peak_body', 'government', 'research_partner', 'internal'
);

CREATE TYPE "TenantOperatingModel" AS ENUM (
  'standalone', 'hub_and_spoke_parent', 'hub_and_spoke_child',
  'federation_member', 'managed_service', 'demo_or_sandbox'
);

CREATE TYPE "TenantDataIsolationMode" AS ENUM (
  'shared_schema_strict', 'shared_schema_row_scoped',
  'dedicated_schema', 'dedicated_database'
);

CREATE TYPE "TenantEnvironment" AS ENUM (
  'sandbox', 'staging', 'limited_production', 'production'
);

CREATE TYPE "TenantEncryptionAlgorithm" AS ENUM (
  'aes_256_gcm_envelope', 'aes_256_gcm_double_wrapped', 'external_kms_managed'
);

CREATE TYPE "TenantFederationType" AS ENUM (
  'peak_body', 'government_partnership', 'research_consortium',
  'cross_provider_cooperative', 'internal'
);

CREATE TYPE "FederationMembershipRole" AS ENUM ('member', 'admin', 'observer', 'hub');
CREATE TYPE "FederationMembershipStatus" AS ENUM ('invited', 'active', 'suspended', 'withdrawn');

CREATE TYPE "DelegatedAuthorityScope" AS ENUM (
  'operational_read', 'operational_write', 'billing_read',
  'incident_read', 'reporting_read', 'service_management'
);

CREATE TYPE "DelegatedAuthorityStatus" AS ENUM (
  'proposed', 'approved', 'active', 'suspended', 'revoked', 'expired'
);

CREATE TYPE "TenantOnboardingStage" AS ENUM (
  'intake', 'due_diligence', 'contracts', 'configuration',
  'pre_launch_review', 'launched_limited', 'launched', 'cancelled'
);

CREATE TYPE "TenantOnboardingDecision" AS ENUM (
  'proceed', 'hold', 'conditional', 'reject', 'escalate'
);

CREATE TYPE "PolicyProfileStatus" AS ENUM (
  'draft', 'in_review', 'approved', 'active', 'superseded', 'retired'
);

CREATE TYPE "RegulatorySourceKind" AS ENUM (
  'ndis_commission', 'ndia', 'privacy_commissioner', 'cyber_authority',
  'state_regulator', 'international', 'internal'
);

CREATE TYPE "RegulatoryChangeStatus" AS ENUM (
  'monitoring', 'triage', 'in_analysis', 'impact_assessed',
  'action_required', 'implemented', 'monitoring_after_change', 'closed'
);

CREATE TYPE "EntitlementStatus" AS ENUM (
  'pending', 'active', 'suspended', 'revoked', 'expired'
);

CREATE TYPE "ReleaseRing" AS ENUM (
  'ring_0_internal', 'ring_1_canary', 'ring_2_pilot',
  'ring_3_general_limited', 'ring_4_general'
);

CREATE TYPE "ReleaseStatus" AS ENUM (
  'draft', 'scheduled', 'in_progress', 'paused',
  'completed', 'rolled_back', 'cancelled'
);

CREATE TYPE "ReleaseApprovalKind" AS ENUM (
  'engineering', 'safety', 'privacy', 'security', 'executive'
);

CREATE TYPE "DeploymentStatus" AS ENUM (
  'scheduled', 'deploying', 'succeeded', 'failed', 'rolled_back', 'skipped'
);

CREATE TYPE "ServiceCatalogueDomain" AS ENUM (
  'care', 'transport', 'billing', 'identity', 'integrations',
  'observability', 'platform', 'data', 'ai', 'workforce', 'compliance'
);

CREATE TYPE "ServiceCriticality" AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TYPE "GeneralAvailabilityDecision" AS ENUM (
  'not_assessed', 'not_ready', 'conditionally_ready',
  'ready_pending_executive', 'approved', 'withdrawn'
);

CREATE TYPE "BreakGlassStatus" AS ENUM (
  'requested', 'approved', 'active', 'expired', 'revoked', 'denied'
);

CREATE TYPE "ModelClassification" AS ENUM (
  'participant_data', 'worker_data', 'claim_and_funding_data',
  'organisation_operational_data', 'platform_operational_data',
  'anonymised_aggregate', 'public_reference'
);

-- ============================================================================
-- Organisation extensions
-- Existing rows: tenantKey NULL until backfilled; tenantStatus defaults to
-- 'active' (existing organisations were already live under Waves 2-7); new
-- rows created by application code should prefer 'active_limited' or lower.
-- ============================================================================

ALTER TABLE "Organisation"
  ADD COLUMN "tenantKey"            TEXT,
  ADD COLUMN "legalName"            TEXT,
  ADD COLUMN "tradingName"          TEXT,
  ADD COLUMN "tenantType"           "TenantType" NOT NULL DEFAULT 'registered_provider',
  ADD COLUMN "operatingModel"       "TenantOperatingModel" NOT NULL DEFAULT 'standalone',
  ADD COLUMN "tenantStatus"         "TenantStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN "parentOrganisationId" TEXT,
  ADD COLUMN "federationId"         TEXT,
  ADD COLUMN "jurisdiction"         TEXT NOT NULL DEFAULT 'AU',
  ADD COLUMN "timezone"             TEXT NOT NULL DEFAULT 'Australia/Sydney',
  ADD COLUMN "defaultLocale"        TEXT NOT NULL DEFAULT 'en-AU',
  ADD COLUMN "dataIsolationMode"    "TenantDataIsolationMode" NOT NULL DEFAULT 'shared_schema_strict',
  ADD COLUMN "dataRegion"           TEXT NOT NULL DEFAULT 'au',
  ADD COLUMN "onboardingStartedAt"  TIMESTAMP(3),
  ADD COLUMN "activatedAt"          TIMESTAMP(3),
  ADD COLUMN "restrictedAt"         TIMESTAMP(3),
  ADD COLUMN "suspendedAt"          TIMESTAMP(3),
  ADD COLUMN "offboardingStartedAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt"           TIMESTAMP(3);

-- Backfill legalName from name for existing rows.
UPDATE "Organisation" SET "legalName" = "name" WHERE "legalName" IS NULL;

-- Backfill tenantKey from a slug of id (safe, cuid-derived; app can rewrite later).
UPDATE "Organisation" SET "tenantKey" = LOWER(SUBSTRING("id" FROM 1 FOR 24)) WHERE "tenantKey" IS NULL;

CREATE UNIQUE INDEX "Organisation_tenantKey_key" ON "Organisation"("tenantKey");
CREATE INDEX "Organisation_tenantStatus_idx" ON "Organisation"("tenantStatus");
CREATE INDEX "Organisation_parentOrganisationId_idx" ON "Organisation"("parentOrganisationId");
CREATE INDEX "Organisation_federationId_idx" ON "Organisation"("federationId");

-- self relation deferred until TenantFederation is created
ALTER TABLE "Organisation"
  ADD CONSTRAINT "Organisation_parentOrganisationId_fkey"
  FOREIGN KEY ("parentOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- Wave 8 tables
-- ============================================================================

CREATE TABLE "TenantStatusTransition" (
  "id"             TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "fromStatus"     "TenantStatus" NOT NULL,
  "toStatus"       "TenantStatus" NOT NULL,
  "reason"         TEXT NOT NULL,
  "metadata"       JSONB,
  "actorUserId"    TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantStatusTransition_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TenantStatusTransition_organisationId_createdAt_idx"
  ON "TenantStatusTransition"("organisationId", "createdAt");
ALTER TABLE "TenantStatusTransition"
  ADD CONSTRAINT "TenantStatusTransition_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TenantStatusTransition_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TenantEncryptionProfile" (
  "id"             TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "algorithm"      "TenantEncryptionAlgorithm" NOT NULL DEFAULT 'aes_256_gcm_envelope',
  "keyReference"   TEXT NOT NULL,
  "kmsProvider"    TEXT,
  "rotationDays"   INTEGER NOT NULL DEFAULT 90,
  "lastRotatedAt"  TIMESTAMP(3),
  "nextRotationAt" TIMESTAMP(3),
  "active"         BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantEncryptionProfile_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TenantEncryptionProfile_organisationId_active_idx"
  ON "TenantEncryptionProfile"("organisationId", "active");
ALTER TABLE "TenantEncryptionProfile"
  ADD CONSTRAINT "TenantEncryptionProfile_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TenantFederation" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "type"        "TenantFederationType" NOT NULL DEFAULT 'peak_body',
  "description" TEXT,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantFederation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Organisation"
  ADD CONSTRAINT "Organisation_federationId_fkey"
  FOREIGN KEY ("federationId") REFERENCES "TenantFederation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "FederationMembership" (
  "id"             TEXT NOT NULL,
  "federationId"   TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "role"           "FederationMembershipRole" NOT NULL DEFAULT 'member',
  "status"         "FederationMembershipStatus" NOT NULL DEFAULT 'invited',
  "scopeJson"      JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FederationMembership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FederationMembership_federationId_organisationId_key"
  ON "FederationMembership"("federationId", "organisationId");
CREATE INDEX "FederationMembership_organisationId_idx"
  ON "FederationMembership"("organisationId");
ALTER TABLE "FederationMembership"
  ADD CONSTRAINT "FederationMembership_federationId_fkey"
  FOREIGN KEY ("federationId") REFERENCES "TenantFederation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "FederationMembership_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DelegatedTenantAuthority" (
  "id"                 TEXT NOT NULL,
  "fromOrganisationId" TEXT NOT NULL,
  "toOrganisationId"   TEXT NOT NULL,
  "scope"              "DelegatedAuthorityScope" NOT NULL,
  "status"             "DelegatedAuthorityStatus" NOT NULL DEFAULT 'proposed',
  "reason"             TEXT NOT NULL,
  "scopeJson"          JSONB,
  "effectiveFrom"      TIMESTAMP(3),
  "expiresAt"          TIMESTAMP(3),
  "approvedByUserId"   TEXT,
  "approvedAt"         TIMESTAMP(3),
  "revokedAt"          TIMESTAMP(3),
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DelegatedTenantAuthority_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DelegatedTenantAuthority_fromOrganisationId_status_idx"
  ON "DelegatedTenantAuthority"("fromOrganisationId", "status");
CREATE INDEX "DelegatedTenantAuthority_toOrganisationId_status_idx"
  ON "DelegatedTenantAuthority"("toOrganisationId", "status");
ALTER TABLE "DelegatedTenantAuthority"
  ADD CONSTRAINT "DelegatedTenantAuthority_fromOrganisationId_fkey"
  FOREIGN KEY ("fromOrganisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DelegatedTenantAuthority_toOrganisationId_fkey"
  FOREIGN KEY ("toOrganisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DelegatedTenantAuthority_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TenantOnboardingCase" (
  "id"             TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "stage"          "TenantOnboardingStage" NOT NULL DEFAULT 'intake',
  "decision"       "TenantOnboardingDecision",
  "ownerUserId"    TEXT,
  "summary"        TEXT,
  "checklistJson"  JSONB,
  "blockersJson"   JSONB,
  "startedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "targetLaunchAt" TIMESTAMP(3),
  "closedAt"       TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantOnboardingCase_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TenantOnboardingCase_organisationId_stage_idx"
  ON "TenantOnboardingCase"("organisationId", "stage");
ALTER TABLE "TenantOnboardingCase"
  ADD CONSTRAINT "TenantOnboardingCase_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TenantOnboardingCase_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TenantPolicyProfile" (
  "id"             TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "profileKey"     TEXT NOT NULL,
  "version"        TEXT NOT NULL,
  "status"         "PolicyProfileStatus" NOT NULL DEFAULT 'draft',
  "policyJson"     JSONB NOT NULL,
  "approvedById"   TEXT,
  "approvedAt"     TIMESTAMP(3),
  "effectiveFrom"  TIMESTAMP(3),
  "effectiveUntil" TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantPolicyProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TenantPolicyProfile_organisationId_profileKey_version_key"
  ON "TenantPolicyProfile"("organisationId", "profileKey", "version");
CREATE INDEX "TenantPolicyProfile_organisationId_status_idx"
  ON "TenantPolicyProfile"("organisationId", "status");
ALTER TABLE "TenantPolicyProfile"
  ADD CONSTRAINT "TenantPolicyProfile_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TenantPolicyProfile_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "RegulatorySource" (
  "id"           TEXT NOT NULL,
  "key"          TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "kind"         "RegulatorySourceKind" NOT NULL,
  "jurisdiction" TEXT NOT NULL DEFAULT 'AU',
  "url"          TEXT,
  "active"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegulatorySource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RegulatorySource_key_key" ON "RegulatorySource"("key");

CREATE TABLE "RegulatoryChangeCase" (
  "id"                TEXT NOT NULL,
  "sourceId"          TEXT NOT NULL,
  "organisationId"    TEXT,
  "title"             TEXT NOT NULL,
  "summary"           TEXT NOT NULL,
  "status"            "RegulatoryChangeStatus" NOT NULL DEFAULT 'monitoring',
  "detectedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveAt"       TIMESTAMP(3),
  "humanReviewerId"   TEXT,
  "reviewedAt"        TIMESTAMP(3),
  "impactAssessment"  TEXT,
  "aiSuggestionsJson" JSONB,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegulatoryChangeCase_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RegulatoryChangeCase_sourceId_status_idx"
  ON "RegulatoryChangeCase"("sourceId", "status");
CREATE INDEX "RegulatoryChangeCase_organisationId_status_idx"
  ON "RegulatoryChangeCase"("organisationId", "status");
ALTER TABLE "RegulatoryChangeCase"
  ADD CONSTRAINT "RegulatoryChangeCase_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "RegulatorySource"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "RegulatoryChangeCase_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "RegulatoryChangeCase_humanReviewerId_fkey"
  FOREIGN KEY ("humanReviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TenantFeatureEntitlement" (
  "id"             TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "featureKey"     TEXT NOT NULL,
  "status"         "EntitlementStatus" NOT NULL DEFAULT 'pending',
  "environment"    "TenantEnvironment" NOT NULL DEFAULT 'sandbox',
  "grantedById"    TEXT,
  "grantedAt"      TIMESTAMP(3),
  "expiresAt"      TIMESTAMP(3),
  "configJson"     JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantFeatureEntitlement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TenantFeatureEntitlement_organisationId_featureKey_env_key"
  ON "TenantFeatureEntitlement"("organisationId", "featureKey", "environment");
CREATE INDEX "TenantFeatureEntitlement_organisationId_status_idx"
  ON "TenantFeatureEntitlement"("organisationId", "status");
ALTER TABLE "TenantFeatureEntitlement"
  ADD CONSTRAINT "TenantFeatureEntitlement_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TenantFeatureEntitlement_grantedById_fkey"
  FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProductionRelease" (
  "id"                     TEXT NOT NULL,
  "releaseKey"             TEXT NOT NULL,
  "title"                  TEXT NOT NULL,
  "summary"                TEXT,
  "targetRing"             "ReleaseRing" NOT NULL DEFAULT 'ring_0_internal',
  "status"                 "ReleaseStatus" NOT NULL DEFAULT 'draft',
  "requestedById"          TEXT NOT NULL,
  "approvals"              JSONB NOT NULL DEFAULT '[]',
  "executiveApprovedById"  TEXT,
  "executiveApprovedAt"    TIMESTAMP(3),
  "scheduledAt"            TIMESTAMP(3),
  "startedAt"              TIMESTAMP(3),
  "completedAt"            TIMESTAMP(3),
  "rolledBackAt"           TIMESTAMP(3),
  "rollbackReason"         TEXT,
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductionRelease_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductionRelease_releaseKey_key" ON "ProductionRelease"("releaseKey");
CREATE INDEX "ProductionRelease_status_targetRing_idx"
  ON "ProductionRelease"("status", "targetRing");
ALTER TABLE "ProductionRelease"
  ADD CONSTRAINT "ProductionRelease_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON UPDATE CASCADE,
  ADD CONSTRAINT "ProductionRelease_executiveApprovedById_fkey"
  FOREIGN KEY ("executiveApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ReleaseDeployment" (
  "id"             TEXT NOT NULL,
  "releaseId"      TEXT NOT NULL,
  "organisationId" TEXT,
  "ring"           "ReleaseRing" NOT NULL,
  "status"         "DeploymentStatus" NOT NULL DEFAULT 'scheduled',
  "initiatedById"  TEXT,
  "scheduledAt"    TIMESTAMP(3),
  "startedAt"      TIMESTAMP(3),
  "completedAt"    TIMESTAMP(3),
  "rollbackReason" TEXT,
  "metadata"       JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReleaseDeployment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ReleaseDeployment_releaseId_ring_idx"
  ON "ReleaseDeployment"("releaseId", "ring");
CREATE INDEX "ReleaseDeployment_organisationId_status_idx"
  ON "ReleaseDeployment"("organisationId", "status");
ALTER TABLE "ReleaseDeployment"
  ADD CONSTRAINT "ReleaseDeployment_releaseId_fkey"
  FOREIGN KEY ("releaseId") REFERENCES "ProductionRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ReleaseDeployment_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ReleaseDeployment_initiatedById_fkey"
  FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ServiceCatalogueEntry" (
  "id"           TEXT NOT NULL,
  "serviceKey"   TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "domain"       "ServiceCatalogueDomain" NOT NULL,
  "criticality"  "ServiceCriticality" NOT NULL DEFAULT 'medium',
  "ownerTeam"    TEXT,
  "description"  TEXT,
  "runbookUrl"   TEXT,
  "slosJson"     JSONB,
  "dependencies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "active"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceCatalogueEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServiceCatalogueEntry_serviceKey_key" ON "ServiceCatalogueEntry"("serviceKey");
CREATE INDEX "ServiceCatalogueEntry_domain_criticality_idx"
  ON "ServiceCatalogueEntry"("domain", "criticality");

CREATE TABLE "TenantQuotaProfile" (
  "id"             TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "profileKey"     TEXT NOT NULL,
  "quotasJson"     JSONB NOT NULL,
  "effectiveFrom"  TIMESTAMP(3),
  "effectiveUntil" TIMESTAMP(3),
  "active"         BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantQuotaProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TenantQuotaProfile_organisationId_profileKey_key"
  ON "TenantQuotaProfile"("organisationId", "profileKey");
ALTER TABLE "TenantQuotaProfile"
  ADD CONSTRAINT "TenantQuotaProfile_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TenantOperationalHealth" (
  "id"                TEXT NOT NULL,
  "organisationId"    TEXT NOT NULL,
  "windowStart"       TIMESTAMP(3) NOT NULL,
  "windowEnd"         TIMESTAMP(3) NOT NULL,
  "availabilityRatio" DOUBLE PRECISION,
  "errorBudgetBurn"   DOUBLE PRECISION,
  "slowRequestRatio"  DOUBLE PRECISION,
  "saturationSummary" JSONB,
  "incidentIds"       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantOperationalHealth_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TenantOperationalHealth_organisationId_windowEnd_idx"
  ON "TenantOperationalHealth"("organisationId", "windowEnd");
ALTER TABLE "TenantOperationalHealth"
  ADD CONSTRAINT "TenantOperationalHealth_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GeneralAvailabilityAssessment" (
  "id"                    TEXT NOT NULL,
  "organisationId"        TEXT NOT NULL,
  "decision"              "GeneralAvailabilityDecision" NOT NULL DEFAULT 'not_assessed',
  "scorecardJson"         JSONB NOT NULL,
  "outstandingBlockers"   JSONB,
  "advisoryOnly"          BOOLEAN NOT NULL DEFAULT true,
  "executiveUserId"       TEXT,
  "executiveDecisionAt"   TIMESTAMP(3),
  "executiveDecisionText" TEXT,
  "aiAssistanceSummary"   TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GeneralAvailabilityAssessment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GeneralAvailabilityAssessment_organisationId_decision_idx"
  ON "GeneralAvailabilityAssessment"("organisationId", "decision");
ALTER TABLE "GeneralAvailabilityAssessment"
  ADD CONSTRAINT "GeneralAvailabilityAssessment_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "GeneralAvailabilityAssessment_executiveUserId_fkey"
  FOREIGN KEY ("executiveUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "BreakGlassSession" (
  "id"                   TEXT NOT NULL,
  "actorUserId"          TEXT NOT NULL,
  "targetOrganisationId" TEXT NOT NULL,
  "reason"               TEXT NOT NULL,
  "ticketRef"            TEXT,
  "status"               "BreakGlassStatus" NOT NULL DEFAULT 'requested',
  "approverUserId"       TEXT,
  "approvedAt"           TIMESTAMP(3),
  "expiresAt"            TIMESTAMP(3) NOT NULL,
  "revokedAt"            TIMESTAMP(3),
  "revokedReason"        TEXT,
  "metadata"             JSONB,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BreakGlassSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BreakGlassSession_actorUserId_status_idx"
  ON "BreakGlassSession"("actorUserId", "status");
CREATE INDEX "BreakGlassSession_targetOrganisationId_status_idx"
  ON "BreakGlassSession"("targetOrganisationId", "status");
CREATE INDEX "BreakGlassSession_expiresAt_idx"
  ON "BreakGlassSession"("expiresAt");
ALTER TABLE "BreakGlassSession"
  ADD CONSTRAINT "BreakGlassSession_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON UPDATE CASCADE,
  ADD CONSTRAINT "BreakGlassSession_targetOrganisationId_fkey"
  FOREIGN KEY ("targetOrganisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "BreakGlassSession_approverUserId_fkey"
  FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TenantModelClassification" (
  "id"                 TEXT NOT NULL,
  "modelName"          TEXT NOT NULL,
  "classification"     "ModelClassification" NOT NULL,
  "organisationScoped" BOOLEAN NOT NULL DEFAULT true,
  "notes"              TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantModelClassification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TenantModelClassification_modelName_key"
  ON "TenantModelClassification"("modelName");
