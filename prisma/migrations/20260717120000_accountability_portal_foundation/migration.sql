-- Public Accountability Portal (Wave 1 foundation)

CREATE TYPE "AccountabilityPublicationStatus" AS ENUM (
  'draft',
  'privacy_review',
  'quality_review',
  'approval_required',
  'approved',
  'published',
  'corrected',
  'withdrawn',
  'archived'
);

CREATE TYPE "AccountabilityCommitmentStatus" AS ENUM (
  'proposed',
  'accepted',
  'planned',
  'in_progress',
  'at_risk',
  'delayed',
  'completed',
  'verified',
  'withdrawn'
);

CREATE TYPE "AccountabilityChallengeStatus" AS ENUM (
  'received',
  'acknowledged',
  'under_review',
  'information_requested',
  'accepted',
  'partially_accepted',
  'not_accepted',
  'corrected',
  'closed'
);

CREATE TYPE "AccountabilityMetricUnit" AS ENUM (
  'count',
  'percentage',
  'duration',
  'currency',
  'rate',
  'score'
);

CREATE TYPE "AccountabilitySensitivity" AS ENUM (
  'public',
  'protected',
  'sensitive',
  'highly_sensitive'
);

CREATE TYPE "AccountabilityEvidenceAccess" AS ENUM (
  'public_citation',
  'internal',
  'restricted'
);

CREATE TABLE "accountability_methodologies" (
  "id" TEXT NOT NULL,
  "publicCode" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "plainLanguage" TEXT NOT NULL,
  "technicalNotes" TEXT,
  "version" TEXT NOT NULL DEFAULT '1',
  "ownerRole" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "accountability_methodologies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_methodologies_publicCode_key" ON "accountability_methodologies"("publicCode");

CREATE TABLE "accountability_metrics" (
  "id" TEXT NOT NULL,
  "publicCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "unit" "AccountabilityMetricUnit" NOT NULL DEFAULT 'count',
  "numeratorDefinition" TEXT,
  "denominatorDefinition" TEXT,
  "methodologyId" TEXT NOT NULL,
  "sensitivity" "AccountabilitySensitivity" NOT NULL DEFAULT 'public',
  "minimumCohortSize" INTEGER NOT NULL DEFAULT 10,
  "updateFrequency" TEXT NOT NULL DEFAULT 'quarterly',
  "ownerRole" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "accountability_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_metrics_publicCode_key" ON "accountability_metrics"("publicCode");
CREATE INDEX "accountability_metrics_domain_isActive_idx" ON "accountability_metrics"("domain", "isActive");

ALTER TABLE "accountability_metrics" ADD CONSTRAINT "accountability_metrics_methodologyId_fkey" FOREIGN KEY ("methodologyId") REFERENCES "accountability_methodologies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "accountability_publication_snapshots" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "reportingPeriodStart" TIMESTAMP(3) NOT NULL,
  "reportingPeriodEnd" TIMESTAMP(3) NOT NULL,
  "status" "AccountabilityPublicationStatus" NOT NULL DEFAULT 'draft',
  "packageJson" JSONB NOT NULL DEFAULT '{}',
  "contentSha256" TEXT,
  "previousSnapshotHash" TEXT,
  "dataCompletenessPct" DOUBLE PRECISION,
  "hasMajorCorrection" BOOLEAN NOT NULL DEFAULT false,
  "hasUnresolvedCriticalCommitment" BOOLEAN NOT NULL DEFAULT false,
  "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  "preparedById" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "accountability_publication_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_publication_snapshots_publicId_key" ON "accountability_publication_snapshots"("publicId");
CREATE INDEX "accountability_publication_snapshots_status_publishedAt_idx" ON "accountability_publication_snapshots"("status", "publishedAt");

CREATE TABLE "accountability_metric_values" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "metricId" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "reportingPeriodStart" TIMESTAMP(3) NOT NULL,
  "reportingPeriodEnd" TIMESTAMP(3) NOT NULL,
  "value" DOUBLE PRECISION,
  "numerator" DOUBLE PRECISION,
  "denominator" DOUBLE PRECISION,
  "target" DOUBLE PRECISION,
  "previousValue" DOUBLE PRECISION,
  "sampleSize" INTEGER,
  "completenessPercentage" DOUBLE PRECISION,
  "status" "AccountabilityPublicationStatus" NOT NULL DEFAULT 'draft',
  "suppressionReason" TEXT,
  "explanatoryNote" TEXT,
  "trendDescription" TEXT,
  "accessibleSummary" TEXT,
  "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "accountability_metric_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_metric_values_publicId_key" ON "accountability_metric_values"("publicId");
CREATE INDEX "accountability_metric_values_metricId_reportingPeriodEnd_idx" ON "accountability_metric_values"("metricId", "reportingPeriodEnd");
CREATE INDEX "accountability_metric_values_snapshotId_status_idx" ON "accountability_metric_values"("snapshotId", "status");

ALTER TABLE "accountability_metric_values" ADD CONSTRAINT "accountability_metric_values_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "accountability_metrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accountability_metric_values" ADD CONSTRAINT "accountability_metric_values_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "accountability_publication_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "accountability_publication_approvals" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "comments" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "accountability_publication_approvals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accountability_publication_approvals_snapshotId_stage_idx" ON "accountability_publication_approvals"("snapshotId", "stage");

ALTER TABLE "accountability_publication_approvals" ADD CONSTRAINT "accountability_publication_approvals_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "accountability_publication_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "accountability_evidence_items" (
  "id" TEXT NOT NULL,
  "publicCitationLabel" TEXT NOT NULL,
  "evidenceType" TEXT NOT NULL,
  "sourceSystem" TEXT,
  "sourceOwner" TEXT,
  "collectionDate" TIMESTAMP(3),
  "reportingPeriodStart" TIMESTAMP(3),
  "reportingPeriodEnd" TIMESTAMP(3),
  "checksum" TEXT,
  "accessClassification" "AccountabilityEvidenceAccess" NOT NULL DEFAULT 'internal',
  "reviewerUserId" TEXT,
  "publicAvailability" BOOLEAN NOT NULL DEFAULT false,
  "snapshotId" TEXT,
  "metadataJson" JSONB NOT NULL DEFAULT '{}',
  "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "accountability_evidence_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accountability_evidence_items_snapshotId_idx" ON "accountability_evidence_items"("snapshotId");

ALTER TABLE "accountability_evidence_items" ADD CONSTRAINT "accountability_evidence_items_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "accountability_publication_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "accountability_disclosure_policies" (
  "id" TEXT NOT NULL,
  "policyKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sensitivity" "AccountabilitySensitivity" NOT NULL DEFAULT 'public',
  "minimumCohortSize" INTEGER NOT NULL DEFAULT 10,
  "roundToNearest" INTEGER,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "accountability_disclosure_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_disclosure_policies_policyKey_key" ON "accountability_disclosure_policies"("policyKey");

CREATE TABLE "accountability_redaction_records" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT,
  "metricValueId" TEXT,
  "fieldName" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "actorUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "accountability_redaction_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accountability_redaction_records_snapshotId_idx" ON "accountability_redaction_records"("snapshotId");

CREATE TABLE "accountability_commitments" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "plainLanguage" TEXT NOT NULL,
  "accountableBody" TEXT NOT NULL,
  "serviceVertical" TEXT,
  "region" TEXT,
  "theme" TEXT,
  "publicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "targetDate" TIMESTAMP(3),
  "status" "AccountabilityCommitmentStatus" NOT NULL DEFAULT 'proposed',
  "latestUpdate" TEXT,
  "nextUpdateDate" TIMESTAMP(3),
  "delayReason" TEXT,
  "withdrawalDate" TIMESTAMP(3),
  "withdrawalReason" TEXT,
  "withdrawalAuthority" TEXT,
  "replacementCommitmentSlug" TEXT,
  "evidenceJson" JSONB NOT NULL DEFAULT '[]',
  "dependenciesJson" JSONB NOT NULL DEFAULT '[]',
  "risksJson" JSONB NOT NULL DEFAULT '[]',
  "milestonesJson" JSONB NOT NULL DEFAULT '[]',
  "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "accountability_commitments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_commitments_slug_key" ON "accountability_commitments"("slug");
CREATE INDEX "accountability_commitments_status_targetDate_idx" ON "accountability_commitments"("status", "targetDate");

CREATE TABLE "accountability_commitment_updates" (
  "id" TEXT NOT NULL,
  "commitmentId" TEXT NOT NULL,
  "status" "AccountabilityCommitmentStatus" NOT NULL,
  "summary" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "accountability_commitment_updates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accountability_commitment_updates_commitmentId_idx" ON "accountability_commitment_updates"("commitmentId");

ALTER TABLE "accountability_commitment_updates" ADD CONSTRAINT "accountability_commitment_updates_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "accountability_commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "accountability_governance_decisions" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "decisionDate" TIMESTAMP(3) NOT NULL,
  "decisionBody" TEXT NOT NULL,
  "questionConsidered" TEXT NOT NULL,
  "decisionSummary" TEXT NOT NULL,
  "optionsConsidered" TEXT,
  "participantRightsImplications" TEXT,
  "accessibilityImplications" TEXT,
  "privacyImplications" TEXT,
  "financialImplications" TEXT,
  "conflictsDeclared" TEXT,
  "dissentingViews" TEXT,
  "implementationOwner" TEXT,
  "reviewDate" TIMESTAMP(3),
  "linkedCommitmentSlugs" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'published',
  "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "accountability_governance_decisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_governance_decisions_publicId_key" ON "accountability_governance_decisions"("publicId");
CREATE INDEX "accountability_governance_decisions_status_decisionDate_idx" ON "accountability_governance_decisions"("status", "decisionDate");

CREATE TABLE "accountability_ai_systems" (
  "id" TEXT NOT NULL,
  "publicCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "serviceVertical" TEXT,
  "decisionRole" TEXT NOT NULL,
  "humanReviewRequired" BOOLEAN NOT NULL DEFAULT true,
  "dataCategoriesJson" JSONB NOT NULL DEFAULT '[]',
  "prohibitedUsesJson" JSONB NOT NULL DEFAULT '[]',
  "knownLimitations" TEXT,
  "affectedUserGroups" TEXT,
  "accessibilityNotes" TEXT,
  "biasFairnessNotes" TEXT,
  "overrideMechanisms" TEXT,
  "appealPathway" TEXT,
  "monitoringFrequency" TEXT,
  "modelOrRuleVersion" TEXT,
  "lastMaterialChangeAt" TIMESTAMP(3),
  "responsibleOwner" TEXT,
  "retirementStatus" TEXT NOT NULL DEFAULT 'active',
  "status" TEXT NOT NULL DEFAULT 'published',
  "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "accountability_ai_systems_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_ai_systems_publicCode_key" ON "accountability_ai_systems"("publicCode");

CREATE TABLE "accountability_ai_evaluations" (
  "id" TEXT NOT NULL,
  "systemId" TEXT NOT NULL,
  "periodLabel" TEXT NOT NULL,
  "metricsJson" JSONB NOT NULL DEFAULT '{}',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "accountability_ai_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accountability_ai_evaluations_systemId_idx" ON "accountability_ai_evaluations"("systemId");

ALTER TABLE "accountability_ai_evaluations" ADD CONSTRAINT "accountability_ai_evaluations_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "accountability_ai_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "accountability_corrections" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "originalValueSummary" TEXT NOT NULL,
  "correctedValueSummary" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "discoveryDate" TIMESTAMP(3) NOT NULL,
  "correctionDate" TIMESTAMP(3) NOT NULL,
  "materiality" TEXT NOT NULL DEFAULT 'material',
  "approvingAuthority" TEXT,
  "snapshotId" TEXT,
  "affectedReportsJson" JSONB NOT NULL DEFAULT '[]',
  "notificationStatus" TEXT NOT NULL DEFAULT 'pending',
  "status" TEXT NOT NULL DEFAULT 'published',
  "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "accountability_corrections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_corrections_publicId_key" ON "accountability_corrections"("publicId");
CREATE INDEX "accountability_corrections_status_correctionDate_idx" ON "accountability_corrections"("status", "correctionDate");

ALTER TABLE "accountability_corrections" ADD CONSTRAINT "accountability_corrections_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "accountability_publication_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "accountability_public_challenges" (
  "id" TEXT NOT NULL,
  "trackingReference" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectPublicId" TEXT,
  "description" TEXT NOT NULL,
  "status" "AccountabilityChallengeStatus" NOT NULL DEFAULT 'received',
  "submitterContactHash" TEXT,
  "publicResponse" TEXT,
  "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  "acknowledgedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "accountability_public_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_public_challenges_trackingReference_key" ON "accountability_public_challenges"("trackingReference");
CREATE INDEX "accountability_public_challenges_status_createdAt_idx" ON "accountability_public_challenges"("status", "createdAt");

CREATE TABLE "accountability_public_submissions" (
  "id" TEXT NOT NULL,
  "trackingReference" TEXT NOT NULL,
  "submissionType" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'received',
  "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "accountability_public_submissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_public_submissions_trackingReference_key" ON "accountability_public_submissions"("trackingReference");

CREATE TABLE "accountability_open_datasets" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "publisher" TEXT NOT NULL DEFAULT 'MapAble',
  "geography" TEXT,
  "updateFrequency" TEXT,
  "licence" TEXT NOT NULL DEFAULT 'CC BY 4.0',
  "methodologySummary" TEXT,
  "schemaJson" JSONB NOT NULL DEFAULT '{}',
  "suppressionRules" TEXT,
  "knownLimitations" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "accountability_open_datasets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_open_datasets_publicId_key" ON "accountability_open_datasets"("publicId");

CREATE TABLE "accountability_dataset_versions" (
  "id" TEXT NOT NULL,
  "datasetId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "reportingPeriodStart" TIMESTAMP(3),
  "reportingPeriodEnd" TIMESTAMP(3),
  "checksum" TEXT,
  "recordCount" INTEGER NOT NULL DEFAULT 0,
  "packageJson" JSONB NOT NULL DEFAULT '{}',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "accountability_dataset_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accountability_dataset_versions_datasetId_version_idx" ON "accountability_dataset_versions"("datasetId", "version");

ALTER TABLE "accountability_dataset_versions" ADD CONSTRAINT "accountability_dataset_versions_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "accountability_open_datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "accountability_subscriptions" (
  "id" TEXT NOT NULL,
  "emailHash" TEXT,
  "userId" TEXT,
  "topicsJson" JSONB NOT NULL DEFAULT '[]',
  "channel" TEXT NOT NULL DEFAULT 'email',
  "consentGranted" BOOLEAN NOT NULL DEFAULT true,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "accountability_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accountability_subscriptions_userId_idx" ON "accountability_subscriptions"("userId");

CREATE TABLE "accountability_public_notices" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "noticeType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'info',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDemonstration" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "accountability_public_notices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accountability_public_notices_publicId_key" ON "accountability_public_notices"("publicId");
CREATE INDEX "accountability_public_notices_isActive_publishedAt_idx" ON "accountability_public_notices"("isActive", "publishedAt");
