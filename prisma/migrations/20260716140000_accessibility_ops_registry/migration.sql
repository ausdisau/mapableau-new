-- AccessibilityOps Wave 1: asset + rule registry (shadow mode)
-- Additive only. No incident migration. No release gates.

CREATE TYPE "AoAssetClass" AS ENUM ('digital', 'built', 'service', 'integration', 'procurement');
CREATE TYPE "AoAssetCriticality" AS ENUM ('informational', 'important', 'essential', 'safety_critical');
CREATE TYPE "AoAssetLifecycle" AS ENUM ('draft', 'registered', 'active', 'deprecated', 'retired');
CREATE TYPE "AoVisibility" AS ENUM ('public', 'internal', 'restricted');
CREATE TYPE "AoRuleProfile" AS ENUM ('act_web', 'mobile', 'document', 'built_environment', 'service_workflow', 'procurement_conformance', 'lived_experience', 'design_system', 'mapable_internal');
CREATE TYPE "AoRuleAutomation" AS ENUM ('automated', 'semi_automated', 'manual', 'lived_experience');
CREATE TYPE "AoSeverity" AS ENUM ('observation', 'minor', 'moderate', 'major', 'critical');
CREATE TYPE "AoOutcome" AS ENUM ('passed', 'failed', 'inapplicable', 'cannot_tell', 'manual_review_required', 'lived_experience_review_required', 'evidence_expired', 'disputed');

CREATE TABLE "accessibility_assets" (
    "id" TEXT NOT NULL,
    "stable_key" TEXT NOT NULL,
    "organisation_id" TEXT,
    "owner_user_id" TEXT,
    "asset_class" "AoAssetClass" NOT NULL,
    "asset_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "plain_language_title" TEXT,
    "description" TEXT,
    "criticality" "AoAssetCriticality" NOT NULL,
    "lifecycle_state" "AoAssetLifecycle" NOT NULL DEFAULT 'registered',
    "visibility" "AoVisibility" NOT NULL DEFAULT 'internal',
    "source_system" TEXT,
    "deployment_environment" TEXT,
    "canonical_domain_ref" TEXT,
    "purpose_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "retired_at" TIMESTAMP(3),

    CONSTRAINT "accessibility_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accessibility_asset_versions" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "version_label" TEXT NOT NULL,
    "content_hash" TEXT,
    "changelog" TEXT,
    "source_revision" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accessibility_asset_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accessibility_asset_dependencies" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "depends_on_asset_id" TEXT NOT NULL,
    "dependency_type" TEXT NOT NULL DEFAULT 'depends_on',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accessibility_asset_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accessibility_asset_owners" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_label" TEXT NOT NULL DEFAULT 'primary_owner',
    "accountable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accessibility_asset_owners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accessibility_standard_sources" (
    "id" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "publication_date" TEXT,
    "retrieval_date" TEXT NOT NULL,
    "effective_date" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accessibility_standard_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accessibility_rules" (
    "id" TEXT NOT NULL,
    "stable_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "plain_language_title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "profile" "AoRuleProfile" NOT NULL,
    "automation" "AoRuleAutomation" NOT NULL,
    "standard_source_id" TEXT NOT NULL,
    "requirement_refs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "internal_interpretation" TEXT,
    "severity_default" "AoSeverity" NOT NULL DEFAULT 'moderate',
    "owner_user_id" TEXT,
    "known_limitations" TEXT,
    "evidence_requirements" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accessibility_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accessibility_rule_versions" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "version_label" TEXT NOT NULL,
    "expectation" TEXT NOT NULL,
    "assumptions" TEXT,
    "input_requirements" TEXT,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "review_by" TIMESTAMP(3),
    "superseded_by_rule_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accessibility_rule_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accessibility_rule_applicability" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "asset_class" "AoAssetClass",
    "asset_type" TEXT,
    "notes" TEXT,

    CONSTRAINT "accessibility_rule_applicability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accessibility_shadow_evaluations" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "asset_version_id" TEXT,
    "mode" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "commercial_plan_ignored" BOOLEAN NOT NULL DEFAULT true,
    "results_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accessibility_shadow_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accessibility_assets_organisation_id_stable_key_key" ON "accessibility_assets"("organisation_id", "stable_key");
CREATE INDEX "accessibility_assets_organisation_id_asset_class_idx" ON "accessibility_assets"("organisation_id", "asset_class");
CREATE INDEX "accessibility_assets_canonical_domain_ref_idx" ON "accessibility_assets"("canonical_domain_ref");

CREATE INDEX "accessibility_asset_versions_asset_id_created_at_idx" ON "accessibility_asset_versions"("asset_id", "created_at");
ALTER TABLE "accessibility_asset_versions" ADD CONSTRAINT "accessibility_asset_versions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "accessibility_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "accessibility_asset_dependencies_asset_id_depends_on_asset_id_dependency_type_key" ON "accessibility_asset_dependencies"("asset_id", "depends_on_asset_id", "dependency_type");
ALTER TABLE "accessibility_asset_dependencies" ADD CONSTRAINT "accessibility_asset_dependencies_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "accessibility_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accessibility_asset_dependencies" ADD CONSTRAINT "accessibility_asset_dependencies_depends_on_asset_id_fkey" FOREIGN KEY ("depends_on_asset_id") REFERENCES "accessibility_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "accessibility_asset_owners_asset_id_user_id_role_label_key" ON "accessibility_asset_owners"("asset_id", "user_id", "role_label");
CREATE INDEX "accessibility_asset_owners_user_id_idx" ON "accessibility_asset_owners"("user_id");
ALTER TABLE "accessibility_asset_owners" ADD CONSTRAINT "accessibility_asset_owners_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "accessibility_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "accessibility_standard_sources_organisation_title_version_key" ON "accessibility_standard_sources"("organisation", "title", "version");

CREATE UNIQUE INDEX "accessibility_rules_stable_key_key" ON "accessibility_rules"("stable_key");
CREATE INDEX "accessibility_rules_profile_idx" ON "accessibility_rules"("profile");
ALTER TABLE "accessibility_rules" ADD CONSTRAINT "accessibility_rules_standard_source_id_fkey" FOREIGN KEY ("standard_source_id") REFERENCES "accessibility_standard_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "accessibility_rule_versions_rule_id_created_at_idx" ON "accessibility_rule_versions"("rule_id", "created_at");
ALTER TABLE "accessibility_rule_versions" ADD CONSTRAINT "accessibility_rule_versions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "accessibility_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "accessibility_rule_applicability_rule_id_idx" ON "accessibility_rule_applicability"("rule_id");
ALTER TABLE "accessibility_rule_applicability" ADD CONSTRAINT "accessibility_rule_applicability_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "accessibility_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "accessibility_shadow_evaluations_asset_id_created_at_idx" ON "accessibility_shadow_evaluations"("asset_id", "created_at");
CREATE INDEX "accessibility_shadow_evaluations_correlation_id_idx" ON "accessibility_shadow_evaluations"("correlation_id");
ALTER TABLE "accessibility_shadow_evaluations" ADD CONSTRAINT "accessibility_shadow_evaluations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "accessibility_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
