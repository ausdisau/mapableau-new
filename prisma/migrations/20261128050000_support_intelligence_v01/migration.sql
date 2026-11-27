-- Support Intelligence v0.1
-- Additive tables for evidence ledger, human review, spider runs, demand aggregates.
-- Optional PostGIS / pgvector enabled only when the extension is available.
-- Forward-only; flags remain default-off. Do not delete audit rows on rollback.

CREATE TABLE IF NOT EXISTS "support_intel_spider_runs" (
  "id" TEXT PRIMARY KEY,
  "adapter_ids" TEXT[] NOT NULL DEFAULT '{}',
  "kept_count" INTEGER NOT NULL DEFAULT 0,
  "duplicate_count" INTEGER NOT NULL DEFAULT 0,
  "excluded_count" INTEGER NOT NULL DEFAULT 0,
  "stale" BOOLEAN NOT NULL DEFAULT false,
  "provenance" JSONB NOT NULL DEFAULT '[]',
  "actor_user_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "support_intel_spider_runs_created_at_idx"
  ON "support_intel_spider_runs" ("created_at");

CREATE TABLE IF NOT EXISTS "support_intel_evidence_claims" (
  "id" TEXT PRIMARY KEY,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "value" JSONB,
  "state" TEXT NOT NULL,
  "evidence_url" TEXT,
  "attributed_to" TEXT,
  "note" TEXT,
  "raw_hash" TEXT,
  "source_kind" TEXT NOT NULL,
  "source_url" TEXT NOT NULL,
  "retrieved_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "valid_until" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "support_intel_evidence_claims_entity_idx"
  ON "support_intel_evidence_claims" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "support_intel_evidence_claims_state_idx"
  ON "support_intel_evidence_claims" ("state");

CREATE TABLE IF NOT EXISTS "support_intel_human_reviews" (
  "id" TEXT PRIMARY KEY,
  "reasons" TEXT[] NOT NULL DEFAULT '{}',
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "notes" TEXT,
  "actor_user_id" TEXT,
  "resolved_by_user_id" TEXT,
  "resolved_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "support_intel_human_reviews_status_idx"
  ON "support_intel_human_reviews" ("status");
CREATE INDEX IF NOT EXISTS "support_intel_human_reviews_entity_idx"
  ON "support_intel_human_reviews" ("entity_type", "entity_id");

CREATE TABLE IF NOT EXISTS "support_intel_demand_cells" (
  "id" TEXT PRIMARY KEY,
  "region_key" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "service_slug" TEXT NOT NULL,
  "unmet_need_count" INTEGER,
  "suppressed" BOOLEAN NOT NULL DEFAULT false,
  "suppression_reason" TEXT,
  "k_threshold" INTEGER NOT NULL DEFAULT 5,
  "computed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "support_intel_demand_cells_region_unique"
    UNIQUE ("region_key", "state", "service_slug", "computed_at")
);

CREATE INDEX IF NOT EXISTS "support_intel_demand_cells_state_idx"
  ON "support_intel_demand_cells" ("state");

-- Strengthen public provider FTS (already present on ndis_providers).
-- Add trigram assist for fuzzy name search when pg_trgm exists.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_trgm') THEN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    BEGIN
      CREATE INDEX IF NOT EXISTS "ndis_providers_provider_name_trgm_idx"
        ON "ndis_providers" USING gin ("provider_name" gin_trgm_ops);
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'ndis_providers missing — skip trigram index';
    END;
  END IF;
END $$;

-- Optional PostGIS for spatial queries when supported.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'postgis') THEN
    CREATE EXTENSION IF NOT EXISTS postgis;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'postgis not available — continuing without spatial extension';
END $$;

-- Optional pgvector for future semantic SMA embeddings when supported.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
    CREATE EXTENSION IF NOT EXISTS vector;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector not available — continuing without vector extension';
END $$;

-- Private SI search projections stay out of the public index.
-- This view is intentionally empty of participant/worker private fields.
CREATE OR REPLACE VIEW "support_intel_public_provider_index" AS
SELECT
  np.source_id,
  np.provider_name,
  np.suburb,
  np.state,
  np.postcode,
  np.services,
  np.latitude,
  np.longitude,
  np.source_url,
  np.ingested_at,
  np.updated_at
FROM "ndis_providers" np;
