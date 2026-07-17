-- Platform Assurance registry (additive). No legal classification claims.

CREATE TYPE "RegulatoryAuthorityClass" AS ENUM (
  'enacted_requirement',
  'published_standard',
  'draft',
  'candidate_recommendation',
  'consultation_proposal',
  'implementation_guidance',
  'organisational_policy',
  'mapable_design_choice'
);

CREATE TYPE "PlatformScopeResult" AS ENUM (
  'likely_in_scope',
  'likely_out_of_scope',
  'mixed_function_review_required',
  'insufficient_evidence',
  'legal_review_required'
);

CREATE TYPE "ScopeAssessmentStatus" AS ENUM (
  'draft',
  'submitted',
  'legal_review',
  'closed'
);

CREATE TABLE "regulatory_source_versions" (
  "id" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "publisher" TEXT NOT NULL,
  "sourceUri" TEXT NOT NULL,
  "versionLabel" TEXT,
  "publicationDate" TIMESTAMP(3),
  "retrievedAt" TIMESTAMP(3) NOT NULL,
  "authorityClass" "RegulatoryAuthorityClass" NOT NULL,
  "summary" TEXT,
  "contentHash" TEXT,
  "isImmutable" BOOLEAN NOT NULL DEFAULT true,
  "supersededById" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "regulatory_source_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "digital_platform_scope_assessments" (
  "id" TEXT NOT NULL,
  "functionName" TEXT NOT NULL,
  "functionDescription" TEXT,
  "moduleKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sourceVersionId" TEXT NOT NULL,
  "answersJson" JSONB NOT NULL DEFAULT '{}',
  "evidenceRefsJson" JSONB NOT NULL DEFAULT '[]',
  "result" "PlatformScopeResult" NOT NULL DEFAULT 'insufficient_evidence',
  "status" "ScopeAssessmentStatus" NOT NULL DEFAULT 'draft',
  "reviewerUserId" TEXT,
  "legalReviewerUserId" TEXT,
  "legalReviewNotes" TEXT,
  "decisionDate" TIMESTAMP(3),
  "nextReviewAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "digital_platform_scope_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "registration_controls" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "complianceControlCode" TEXT,
  "requirementSourceKey" TEXT,
  "status" "ComplianceControlStatus" NOT NULL DEFAULT 'not_started',
  "ownerRole" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "registration_controls_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "regulatory_source_versions_sourceKey_retrievedAt_key"
  ON "regulatory_source_versions"("sourceKey", "retrievedAt");
CREATE INDEX "regulatory_source_versions_sourceKey_idx"
  ON "regulatory_source_versions"("sourceKey");
CREATE INDEX "regulatory_source_versions_authorityClass_idx"
  ON "regulatory_source_versions"("authorityClass");

CREATE INDEX "digital_platform_scope_assessments_status_idx"
  ON "digital_platform_scope_assessments"("status");
CREATE INDEX "digital_platform_scope_assessments_result_idx"
  ON "digital_platform_scope_assessments"("result");
CREATE INDEX "digital_platform_scope_assessments_sourceVersionId_idx"
  ON "digital_platform_scope_assessments"("sourceVersionId");
CREATE INDEX "digital_platform_scope_assessments_createdByUserId_idx"
  ON "digital_platform_scope_assessments"("createdByUserId");

CREATE UNIQUE INDEX "registration_controls_code_key" ON "registration_controls"("code");
CREATE INDEX "registration_controls_category_idx" ON "registration_controls"("category");
CREATE INDEX "registration_controls_complianceControlCode_idx"
  ON "registration_controls"("complianceControlCode");

ALTER TABLE "regulatory_source_versions"
  ADD CONSTRAINT "regulatory_source_versions_supersededById_fkey"
  FOREIGN KEY ("supersededById") REFERENCES "regulatory_source_versions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "digital_platform_scope_assessments"
  ADD CONSTRAINT "digital_platform_scope_assessments_sourceVersionId_fkey"
  FOREIGN KEY ("sourceVersionId") REFERENCES "regulatory_source_versions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
