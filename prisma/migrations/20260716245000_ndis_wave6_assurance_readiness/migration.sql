-- Wave 6: registration cyber assurance and go-live readiness controls
-- Forward-only. Extends SecurityFramework/Control/Evidence; does not replace them.

-- Enums
CREATE TYPE "AssuranceFrameworkKind" AS ENUM (
  'internal_baseline',
  'soc2_readiness',
  'iso27001_readiness',
  'privacy_act_app',
  'ndis_quality_safeguards',
  'ndia_digital_platform',
  'essential_eight_aligned',
  'other'
);

CREATE TYPE "AssuranceControlStatus" AS ENUM (
  'not_started',
  'designed',
  'implemented',
  'operating',
  'ineffective',
  'not_applicable',
  'exception_granted'
);

CREATE TYPE "AssuranceEvidenceType" AS ENUM (
  'policy',
  'procedure',
  'config_export',
  'log_export',
  'screenshot',
  'test_result',
  'attestation',
  'third_party_report',
  'architecture_diagram',
  'other'
);

CREATE TYPE "AssuranceEvidenceClassification" AS ENUM (
  'public',
  'internal',
  'confidential',
  'restricted'
);

CREATE TYPE "AssuranceTestResult" AS ENUM (
  'pass',
  'fail',
  'partial',
  'not_run',
  'blocked',
  'waived'
);

CREATE TYPE "AssuranceExceptionStatus" AS ENUM (
  'proposed',
  'approved',
  'rejected',
  'expired',
  'revoked'
);

CREATE TYPE "AssuranceReadinessDecision" AS ENUM (
  'not_ready',
  'conditionally_ready',
  'ready_for_registration_submission',
  'ready_for_external_assurance',
  'ready_for_controlled_pilot',
  'blocked'
);

CREATE TYPE "WorkerPlatformEligibilityStatus" AS ENUM (
  'not_assessed',
  'pending_clearance',
  'eligible',
  'conditionally_eligible',
  'ineligible',
  'suspended',
  'source_unavailable'
);

CREATE TYPE "WorkerClearanceStatus" AS ENUM (
  'not_started',
  'pending',
  'verified',
  'expired',
  'revoked',
  'self_declared',
  'source_unavailable'
);

CREATE TYPE "WorkerBanningAssessmentStatus" AS ENUM (
  'not_checked',
  'clear',
  'match_found',
  'inconclusive',
  'source_unavailable'
);

CREATE TYPE "WorkerCredentialVerificationStatus" AS ENUM (
  'self_declared',
  'document_on_file',
  'externally_verified',
  'expired',
  'revoked',
  'rejected'
);

CREATE TYPE "NdisRegistrationPathway" AS ENUM (
  'new_provider',
  'existing_provider_variation',
  'digital_platform',
  'plan_management',
  'support_coordination',
  'other'
);

CREATE TYPE "NdisRegistrationApplicationStatus" AS ENUM (
  'draft',
  'evidence_incomplete',
  'internal_review',
  'ready_to_submit',
  'submitted_externally',
  'additional_info_requested',
  'approved_externally',
  'rejected_externally',
  'withdrawn',
  'superseded'
);

CREATE TYPE "NdiaDigitalPartnershipStatus" AS ENUM (
  'not_started',
  'draft',
  'internal_ready',
  'awaiting_external_pack',
  'submitted',
  'in_assessment',
  'approved',
  'rejected',
  'suspended',
  'withdrawn'
);

CREATE TYPE "ProductionGoLiveDecision" AS ENUM (
  'not_assessed',
  'blocked',
  'conditionally_approved',
  'approved_for_pilot',
  'approved_for_production',
  'revoked'
);

CREATE TYPE "ControlledPilotStatus" AS ENUM (
  'draft',
  'pending_approval',
  'approved_not_activated',
  'active',
  'paused',
  'completed',
  'aborted',
  'retired'
);

CREATE TYPE "SecurityFindingSeverity" AS ENUM (
  'informational',
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE "SecurityFindingStatus" AS ENUM (
  'open',
  'accepted_risk',
  'in_remediation',
  'mitigated',
  'closed',
  'false_positive'
);

CREATE TYPE "NdiaEvidenceLinkageStatus" AS ENUM (
  'exact_match',
  'partially_linked',
  'ambiguous',
  'unsafe',
  'superseded'
);

CREATE TYPE "AssuranceControlTestKind" AS ENUM (
  'manual',
  'automated',
  'inquiry',
  'inspection',
  'reperformance'
);

CREATE TYPE "DataProcessingLawfulBasis" AS ENUM (
  'consent',
  'contract',
  'legal_obligation',
  'vital_interests',
  'public_task',
  'legitimate_interests',
  'other'
);

-- Extend SecurityFramework
ALTER TABLE "SecurityFramework"
  ADD COLUMN IF NOT EXISTS "kind" "AssuranceFrameworkKind",
  ADD COLUMN IF NOT EXISTS "version" TEXT NOT NULL DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS "sourceLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "scopeStatement" TEXT,
  ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "effectiveFrom" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "effectiveTo" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "SecurityFramework"
SET "kind" = CASE
  WHEN "type"::text = 'soc2' THEN 'soc2_readiness'::"AssuranceFrameworkKind"
  WHEN "type"::text = 'iso27001' THEN 'iso27001_readiness'::"AssuranceFrameworkKind"
  WHEN "type"::text = 'privacy_act' THEN 'privacy_act_app'::"AssuranceFrameworkKind"
  WHEN "type"::text = 'ndis_quality_safeguards' THEN 'ndis_quality_safeguards'::"AssuranceFrameworkKind"
  ELSE 'internal_baseline'::"AssuranceFrameworkKind"
END
WHERE "kind" IS NULL;

ALTER TABLE "SecurityFramework"
  ALTER COLUMN "kind" SET NOT NULL,
  ALTER COLUMN "kind" SET DEFAULT 'internal_baseline'::"AssuranceFrameworkKind";

-- Extend SecurityControl
ALTER TABLE "SecurityControl"
  ADD COLUMN IF NOT EXISTS "controlCode" TEXT,
  ADD COLUMN IF NOT EXISTS "objective" TEXT,
  ADD COLUMN IF NOT EXISTS "controlOwnerId" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewerId" TEXT,
  ADD COLUMN IF NOT EXISTS "testingFrequency" TEXT,
  ADD COLUMN IF NOT EXISTS "evidenceFreshnessDays" INTEGER NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS "assuranceStatus" "AssuranceControlStatus" NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS "lastAssessedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextAssessmentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "SecurityControl" SET "controlCode" = "code" WHERE "controlCode" IS NULL;
ALTER TABLE "SecurityControl" ALTER COLUMN "controlCode" SET NOT NULL;

-- Extend SecurityEvidence (compat thin record)
ALTER TABLE "SecurityEvidence"
  ADD COLUMN IF NOT EXISTS "assuranceEvidenceId" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Extend VendorRiskAssessment
ALTER TABLE "VendorRiskAssessment"
  ADD COLUMN IF NOT EXISTS "organisationId" TEXT,
  ADD COLUMN IF NOT EXISTS "vendorCategory" TEXT,
  ADD COLUMN IF NOT EXISTS "dataAccessScope" TEXT,
  ADD COLUMN IF NOT EXISTS "residualRiskLevel" TEXT,
  ADD COLUMN IF NOT EXISTS "nextReviewAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "assessorUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Extend NdiaClaimEvidenceBundle
ALTER TABLE "NdiaClaimEvidenceBundle"
  ADD COLUMN IF NOT EXISTS "organisationId" TEXT,
  ADD COLUMN IF NOT EXISTS "billableItemIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "linkageStatus" "NdiaEvidenceLinkageStatus" NOT NULL DEFAULT 'unsafe',
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Extend IncidentReport with optional assurance fields
ALTER TABLE "IncidentReport"
  ADD COLUMN IF NOT EXISTS "assuranceFindingId" TEXT,
  ADD COLUMN IF NOT EXISTS "isOperationalSecurityIncident" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "containmentSummary" TEXT;

-- AssuranceEvidence (primary evidence model)
CREATE TABLE "AssuranceEvidence" (
  "id" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "evidenceType" "AssuranceEvidenceType" NOT NULL,
  "classification" "AssuranceEvidenceClassification" NOT NULL DEFAULT 'internal',
  "summary" TEXT,
  "storageUri" TEXT,
  "documentId" TEXT,
  "checksumSha256" TEXT,
  "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "collectedById" TEXT,
  "supersededById" TEXT,
  "isCurrent" BOOLEAN NOT NULL DEFAULT true,
  "metadataJson" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssuranceEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssuranceControlMapping" (
  "id" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "targetFrameworkKind" "AssuranceFrameworkKind" NOT NULL,
  "targetControlCode" TEXT NOT NULL,
  "mappingNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssuranceControlMapping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssuranceControlTest" (
  "id" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "AssuranceControlTestKind" NOT NULL DEFAULT 'manual',
  "procedureSummary" TEXT NOT NULL,
  "expectedOutcome" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssuranceControlTest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssuranceControlTestRun" (
  "id" TEXT NOT NULL,
  "testId" TEXT NOT NULL,
  "result" "AssuranceTestResult" NOT NULL DEFAULT 'not_run',
  "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "executedById" TEXT,
  "findingsSummary" TEXT,
  "evidenceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "blocksReadiness" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssuranceControlTestRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssuranceException" (
  "id" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "organisationId" TEXT,
  "title" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "status" "AssuranceExceptionStatus" NOT NULL DEFAULT 'proposed',
  "compensatingControls" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssuranceException_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulatoryDateConfig" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "effectiveDate" TIMESTAMP(3) NOT NULL,
  "description" TEXT,
  "sourceLabel" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegulatoryDateConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RegulatoryDateConfig_key_key" ON "RegulatoryDateConfig"("key");

INSERT INTO "RegulatoryDateConfig" ("id", "key", "label", "effectiveDate", "description", "sourceLabel")
VALUES
  ('rdc_2026_07_01', 'ndis_wave6_milestone_2026_07_01', 'July 2026 milestone', '2026-07-01 00:00:00', 'Configuration-backed regulatory milestone (not legal advice)', 'internal_config'),
  ('rdc_2026_10_01', 'ndis_wave6_milestone_2026_10_01', 'October 2026 milestone', '2026-10-01 00:00:00', 'Configuration-backed regulatory milestone (not legal advice)', 'internal_config'),
  ('rdc_2027_01_01', 'ndis_wave6_milestone_2027_01_01', 'January 2027 milestone', '2027-01-01 00:00:00', 'Configuration-backed regulatory milestone (not legal advice)', 'internal_config');

CREATE TABLE "NdisRegistrationApplication" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "pathway" "NdisRegistrationPathway" NOT NULL,
  "status" "NdisRegistrationApplicationStatus" NOT NULL DEFAULT 'draft',
  "registrationGroups" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "includes0137" BOOLEAN NOT NULL DEFAULT false,
  "decisionNotes" TEXT,
  "submittedAt" TIMESTAMP(3),
  "externalReference" TEXT,
  "ownerUserId" TEXT,
  "readinessDecision" "AssuranceReadinessDecision" NOT NULL DEFAULT 'not_ready',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdisRegistrationApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdiaDigitalPartnershipApplication" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "status" "NdiaDigitalPartnershipStatus" NOT NULL DEFAULT 'not_started',
  "technicalPackReference" TEXT,
  "myIdConfigured" BOOLEAN NOT NULL DEFAULT false,
  "ramConfigured" BOOLEAN NOT NULL DEFAULT false,
  "credentialsPresent" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "ownerUserId" TEXT,
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdiaDigitalPartnershipApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkerPlatformEligibilityAssessment" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "workerUserId" TEXT NOT NULL,
  "status" "WorkerPlatformEligibilityStatus" NOT NULL DEFAULT 'not_assessed',
  "clearanceStatus" "WorkerClearanceStatus" NOT NULL DEFAULT 'not_started',
  "banningStatus" "WorkerBanningAssessmentStatus" NOT NULL DEFAULT 'not_checked',
  "assessedAt" TIMESTAMP(3),
  "assessedById" TEXT,
  "rationale" TEXT,
  "blocksPlatformWork" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkerPlatformEligibilityAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkerBanningOrderAssessment" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "workerUserId" TEXT NOT NULL,
  "status" "WorkerBanningAssessmentStatus" NOT NULL DEFAULT 'not_checked',
  "sourceLabel" TEXT NOT NULL DEFAULT 'unconfigured',
  "checkedAt" TIMESTAMP(3),
  "checkedById" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkerBanningOrderAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkerCredential" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "workerUserId" TEXT NOT NULL,
  "credentialType" TEXT NOT NULL,
  "verificationStatus" "WorkerCredentialVerificationStatus" NOT NULL DEFAULT 'self_declared',
  "issuedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "verifiedById" TEXT,
  "documentId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkerCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataProcessingActivity" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "name" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "lawfulBasis" "DataProcessingLawfulBasis" NOT NULL,
  "dataCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "retentionPolicy" TEXT,
  "systemsInvolved" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "ownerUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DataProcessingActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParticipantConsentPurposeRecord" (
  "id" TEXT NOT NULL,
  "consentRecordId" TEXT,
  "participantUserId" TEXT NOT NULL,
  "organisationId" TEXT,
  "purposeKey" TEXT NOT NULL,
  "purposeLabel" TEXT NOT NULL,
  "granted" BOOLEAN NOT NULL DEFAULT false,
  "grantedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParticipantConsentPurposeRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SecurityFinding" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "title" TEXT NOT NULL,
  "severity" "SecurityFindingSeverity" NOT NULL DEFAULT 'medium',
  "status" "SecurityFindingStatus" NOT NULL DEFAULT 'open',
  "source" TEXT NOT NULL,
  "controlId" TEXT,
  "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "ownerUserId" TEXT,
  "summary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalIncident" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "incidentReportId" TEXT,
  "title" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'open',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "impactSummary" TEXT,
  "rootCauseSummary" TEXT,
  "ownerUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperationalIncident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductionGoLiveAssessment" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "decision" "ProductionGoLiveDecision" NOT NULL DEFAULT 'not_assessed',
  "readinessDecision" "AssuranceReadinessDecision" NOT NULL DEFAULT 'not_ready',
  "featureFlagsSatisfied" BOOLEAN NOT NULL DEFAULT false,
  "assuranceSatisfied" BOOLEAN NOT NULL DEFAULT false,
  "registrationSatisfied" BOOLEAN NOT NULL DEFAULT false,
  "ndiaPartnershipSatisfied" BOOLEAN NOT NULL DEFAULT false,
  "workerTrustSatisfied" BOOLEAN NOT NULL DEFAULT false,
  "rollbackPlanDocumented" BOOLEAN NOT NULL DEFAULT false,
  "decisionNotes" TEXT,
  "assessedById" TEXT,
  "assessedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductionGoLiveAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ControlledPilot" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "ControlledPilotStatus" NOT NULL DEFAULT 'draft',
  "scopeStatement" TEXT NOT NULL,
  "maxParticipants" INTEGER,
  "autoActivateForbidden" BOOLEAN NOT NULL DEFAULT true,
  "activatedAt" TIMESTAMP(3),
  "pausedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "goLiveAssessmentId" TEXT,
  "createdById" TEXT NOT NULL,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ControlledPilot_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "SecurityFramework"
  ADD CONSTRAINT "SecurityFramework_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SecurityFramework"
  ADD CONSTRAINT "SecurityFramework_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SecurityControl"
  ADD CONSTRAINT "SecurityControl_controlOwnerId_fkey"
  FOREIGN KEY ("controlOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SecurityControl"
  ADD CONSTRAINT "SecurityControl_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssuranceEvidence"
  ADD CONSTRAINT "AssuranceEvidence_controlId_fkey"
  FOREIGN KEY ("controlId") REFERENCES "SecurityControl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssuranceEvidence"
  ADD CONSTRAINT "AssuranceEvidence_collectedById_fkey"
  FOREIGN KEY ("collectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssuranceEvidence"
  ADD CONSTRAINT "AssuranceEvidence_supersededById_fkey"
  FOREIGN KEY ("supersededById") REFERENCES "AssuranceEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SecurityEvidence"
  ADD CONSTRAINT "SecurityEvidence_assuranceEvidenceId_fkey"
  FOREIGN KEY ("assuranceEvidenceId") REFERENCES "AssuranceEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssuranceControlMapping"
  ADD CONSTRAINT "AssuranceControlMapping_controlId_fkey"
  FOREIGN KEY ("controlId") REFERENCES "SecurityControl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssuranceControlTest"
  ADD CONSTRAINT "AssuranceControlTest_controlId_fkey"
  FOREIGN KEY ("controlId") REFERENCES "SecurityControl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssuranceControlTestRun"
  ADD CONSTRAINT "AssuranceControlTestRun_testId_fkey"
  FOREIGN KEY ("testId") REFERENCES "AssuranceControlTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssuranceControlTestRun"
  ADD CONSTRAINT "AssuranceControlTestRun_executedById_fkey"
  FOREIGN KEY ("executedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssuranceException"
  ADD CONSTRAINT "AssuranceException_controlId_fkey"
  FOREIGN KEY ("controlId") REFERENCES "SecurityControl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssuranceException"
  ADD CONSTRAINT "AssuranceException_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssuranceException"
  ADD CONSTRAINT "AssuranceException_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssuranceException"
  ADD CONSTRAINT "AssuranceException_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NdisRegistrationApplication"
  ADD CONSTRAINT "NdisRegistrationApplication_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NdisRegistrationApplication"
  ADD CONSTRAINT "NdisRegistrationApplication_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NdiaDigitalPartnershipApplication"
  ADD CONSTRAINT "NdiaDigitalPartnershipApplication_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NdiaDigitalPartnershipApplication"
  ADD CONSTRAINT "NdiaDigitalPartnershipApplication_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkerPlatformEligibilityAssessment"
  ADD CONSTRAINT "WorkerPlatformEligibilityAssessment_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkerPlatformEligibilityAssessment"
  ADD CONSTRAINT "WorkerPlatformEligibilityAssessment_workerUserId_fkey"
  FOREIGN KEY ("workerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkerPlatformEligibilityAssessment"
  ADD CONSTRAINT "WorkerPlatformEligibilityAssessment_assessedById_fkey"
  FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkerBanningOrderAssessment"
  ADD CONSTRAINT "WorkerBanningOrderAssessment_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkerBanningOrderAssessment"
  ADD CONSTRAINT "WorkerBanningOrderAssessment_workerUserId_fkey"
  FOREIGN KEY ("workerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkerBanningOrderAssessment"
  ADD CONSTRAINT "WorkerBanningOrderAssessment_checkedById_fkey"
  FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkerCredential"
  ADD CONSTRAINT "WorkerCredential_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkerCredential"
  ADD CONSTRAINT "WorkerCredential_workerUserId_fkey"
  FOREIGN KEY ("workerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkerCredential"
  ADD CONSTRAINT "WorkerCredential_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DataProcessingActivity"
  ADD CONSTRAINT "DataProcessingActivity_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DataProcessingActivity"
  ADD CONSTRAINT "DataProcessingActivity_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ParticipantConsentPurposeRecord"
  ADD CONSTRAINT "ParticipantConsentPurposeRecord_consentRecordId_fkey"
  FOREIGN KEY ("consentRecordId") REFERENCES "ConsentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ParticipantConsentPurposeRecord"
  ADD CONSTRAINT "ParticipantConsentPurposeRecord_participantUserId_fkey"
  FOREIGN KEY ("participantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParticipantConsentPurposeRecord"
  ADD CONSTRAINT "ParticipantConsentPurposeRecord_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SecurityFinding"
  ADD CONSTRAINT "SecurityFinding_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SecurityFinding"
  ADD CONSTRAINT "SecurityFinding_controlId_fkey"
  FOREIGN KEY ("controlId") REFERENCES "SecurityControl"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SecurityFinding"
  ADD CONSTRAINT "SecurityFinding_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OperationalIncident"
  ADD CONSTRAINT "OperationalIncident_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OperationalIncident"
  ADD CONSTRAINT "OperationalIncident_incidentReportId_fkey"
  FOREIGN KEY ("incidentReportId") REFERENCES "IncidentReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OperationalIncident"
  ADD CONSTRAINT "OperationalIncident_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductionGoLiveAssessment"
  ADD CONSTRAINT "ProductionGoLiveAssessment_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductionGoLiveAssessment"
  ADD CONSTRAINT "ProductionGoLiveAssessment_assessedById_fkey"
  FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ControlledPilot"
  ADD CONSTRAINT "ControlledPilot_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ControlledPilot"
  ADD CONSTRAINT "ControlledPilot_goLiveAssessmentId_fkey"
  FOREIGN KEY ("goLiveAssessmentId") REFERENCES "ProductionGoLiveAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ControlledPilot"
  ADD CONSTRAINT "ControlledPilot_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ControlledPilot"
  ADD CONSTRAINT "ControlledPilot_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VendorRiskAssessment"
  ADD CONSTRAINT "VendorRiskAssessment_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VendorRiskAssessment"
  ADD CONSTRAINT "VendorRiskAssessment_assessorUserId_fkey"
  FOREIGN KEY ("assessorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NdiaClaimEvidenceBundle"
  ADD CONSTRAINT "NdiaClaimEvidenceBundle_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IncidentReport"
  ADD CONSTRAINT "IncidentReport_assuranceFindingId_fkey"
  FOREIGN KEY ("assuranceFindingId") REFERENCES "SecurityFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "AssuranceEvidence_controlId_idx" ON "AssuranceEvidence"("controlId");
CREATE INDEX "AssuranceEvidence_isCurrent_expiresAt_idx" ON "AssuranceEvidence"("isCurrent", "expiresAt");
CREATE INDEX "AssuranceControlMapping_controlId_idx" ON "AssuranceControlMapping"("controlId");
CREATE UNIQUE INDEX "AssuranceControlMapping_controlId_targetFrameworkKind_targetControlCode_key"
  ON "AssuranceControlMapping"("controlId", "targetFrameworkKind", "targetControlCode");
CREATE INDEX "AssuranceControlTest_controlId_idx" ON "AssuranceControlTest"("controlId");
CREATE INDEX "AssuranceControlTestRun_testId_result_idx" ON "AssuranceControlTestRun"("testId", "result");
CREATE INDEX "AssuranceException_controlId_status_idx" ON "AssuranceException"("controlId", "status");
CREATE INDEX "NdisRegistrationApplication_organisationId_status_idx" ON "NdisRegistrationApplication"("organisationId", "status");
CREATE INDEX "NdiaDigitalPartnershipApplication_organisationId_status_idx" ON "NdiaDigitalPartnershipApplication"("organisationId", "status");
CREATE INDEX "WorkerPlatformEligibilityAssessment_organisationId_workerUserId_idx"
  ON "WorkerPlatformEligibilityAssessment"("organisationId", "workerUserId");
CREATE INDEX "WorkerBanningOrderAssessment_organisationId_workerUserId_idx"
  ON "WorkerBanningOrderAssessment"("organisationId", "workerUserId");
CREATE INDEX "WorkerCredential_organisationId_workerUserId_idx" ON "WorkerCredential"("organisationId", "workerUserId");
CREATE INDEX "ParticipantConsentPurposeRecord_participantUserId_purposeKey_idx"
  ON "ParticipantConsentPurposeRecord"("participantUserId", "purposeKey");
CREATE INDEX "SecurityFinding_status_severity_idx" ON "SecurityFinding"("status", "severity");
CREATE INDEX "ProductionGoLiveAssessment_organisationId_decision_idx"
  ON "ProductionGoLiveAssessment"("organisationId", "decision");
CREATE INDEX "ControlledPilot_organisationId_status_idx" ON "ControlledPilot"("organisationId", "status");
CREATE INDEX "NdiaClaimEvidenceBundle_organisationId_linkageStatus_idx"
  ON "NdiaClaimEvidenceBundle"("organisationId", "linkageStatus");
CREATE INDEX "SecurityControl_controlCode_idx" ON "SecurityControl"("controlCode");
CREATE INDEX "SecurityFramework_kind_active_idx" ON "SecurityFramework"("kind", "active");
