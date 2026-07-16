-- MapAble Civic Wave 1: Civic Asset Registry + source/version registry
-- Additive only. No AccessPlace duplication. No public Observatory. No incidents.

CREATE TYPE "CivicAssetClass" AS ENUM ('transport', 'pedestrian_realm', 'curb_parking', 'buildings_services', 'events', 'service_infrastructure');
CREATE TYPE "CivicAssetLifecycle" AS ENUM ('draft', 'registered', 'active', 'deprecated', 'retired');
CREATE TYPE "CivicVisibility" AS ENUM ('public', 'internal', 'restricted');
CREATE TYPE "CivicExternalSystem" AS ENUM ('access_place', 'access_floor_plan', 'indoor_feature', 'transport_pickup', 'transport_dropoff', 'transport_vehicle', 'gtfs_stop', 'gtfs_pathway', 'cds_curb_zone', 'accessibility_ops_asset', 'council_ams', 'operator_feed', 'other');
CREATE TYPE "CivicSourceKind" AS ENUM ('mapable_canonical', 'partner_feed', 'government_open_data', 'operator', 'venue', 'community_mapping', 'assessor', 'synthetic_pilot', 'other');
CREATE TYPE "CivicLicenceKind" AS ENUM ('cc_by', 'cc_by_sa', 'cc_by_nc', 'open_government', 'restricted_operational', 'commercial', 'community_contributed', 'research_extract', 'emergency', 'internal', 'unknown');

CREATE TABLE "civic_sources" (
    "id" TEXT NOT NULL,
    "stable_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "CivicSourceKind" NOT NULL,
    "organisation_id" TEXT,
    "publisher" TEXT,
    "homepage_url" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "civic_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "civic_source_versions" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "version_label" TEXT NOT NULL,
    "retrieved_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "content_hash" TEXT,
    "feed_url" TEXT,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "civic_source_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "civic_source_licences" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "licence_kind" "CivicLicenceKind" NOT NULL,
    "licence_name" TEXT NOT NULL,
    "licence_url" TEXT,
    "attribution_text" TEXT,
    "allows_public_publication" BOOLEAN NOT NULL DEFAULT false,
    "allows_commercial_reuse" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "civic_source_licences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "civic_assets" (
    "id" TEXT NOT NULL,
    "stable_key" TEXT NOT NULL,
    "organisation_id" TEXT,
    "owner_organisation_id" TEXT,
    "operator_organisation_id" TEXT,
    "access_place_id" TEXT,
    "source_id" TEXT,
    "asset_class" "CivicAssetClass" NOT NULL,
    "asset_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "plain_language_title" TEXT,
    "description" TEXT,
    "jurisdiction_code" TEXT,
    "lifecycle_state" "CivicAssetLifecycle" NOT NULL DEFAULT 'registered',
    "visibility" "CivicVisibility" NOT NULL DEFAULT 'internal',
    "geometry" JSONB,
    "operating_hours" TEXT,
    "accessibility_claims" JSONB NOT NULL DEFAULT '[]',
    "last_verified_at" TIMESTAMP(3),
    "next_review_at" TIMESTAMP(3),
    "attribution" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "retired_at" TIMESTAMP(3),

    CONSTRAINT "civic_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "civic_asset_versions" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "version_label" TEXT NOT NULL,
    "content_hash" TEXT,
    "changelog" TEXT,
    "source_revision" TEXT,
    "projection_snapshot" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "civic_asset_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "civic_asset_external_references" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "system" "CivicExternalSystem" NOT NULL,
    "external_id" TEXT NOT NULL,
    "canonical_ref" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "civic_asset_external_references_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "civic_sources_stable_key_key" ON "civic_sources"("stable_key");
CREATE INDEX "civic_sources_kind_idx" ON "civic_sources"("kind");

CREATE INDEX "civic_source_versions_source_id_created_at_idx" ON "civic_source_versions"("source_id", "created_at");
CREATE INDEX "civic_source_licences_source_id_idx" ON "civic_source_licences"("source_id");

CREATE UNIQUE INDEX "civic_assets_organisation_id_stable_key_key" ON "civic_assets"("organisation_id", "stable_key");
CREATE INDEX "civic_assets_access_place_id_idx" ON "civic_assets"("access_place_id");
CREATE INDEX "civic_assets_organisation_id_asset_class_idx" ON "civic_assets"("organisation_id", "asset_class");
CREATE INDEX "civic_assets_jurisdiction_code_idx" ON "civic_assets"("jurisdiction_code");

CREATE INDEX "civic_asset_versions_asset_id_created_at_idx" ON "civic_asset_versions"("asset_id", "created_at");
CREATE UNIQUE INDEX "civic_asset_external_references_asset_id_system_external_id_key" ON "civic_asset_external_references"("asset_id", "system", "external_id");
CREATE INDEX "civic_asset_external_references_system_external_id_idx" ON "civic_asset_external_references"("system", "external_id");

ALTER TABLE "civic_source_versions" ADD CONSTRAINT "civic_source_versions_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "civic_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "civic_source_licences" ADD CONSTRAINT "civic_source_licences_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "civic_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- access_place_id is a soft reference (no FK) so synthetic pilot IDs can bind before AccessPlace rows exist.
ALTER TABLE "civic_assets" ADD CONSTRAINT "civic_assets_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "civic_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "civic_asset_versions" ADD CONSTRAINT "civic_asset_versions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "civic_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "civic_asset_external_references" ADD CONSTRAINT "civic_asset_external_references_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "civic_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
