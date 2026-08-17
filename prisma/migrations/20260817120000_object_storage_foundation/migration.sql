-- Provider-neutral object storage metadata. Bytes remain in ObjectStore.
-- Additive only. Not a Document replacement and not a second Access Graph SoT.

DO $$ BEGIN
  CREATE TYPE "StorageAccessClassification" AS ENUM (
    'PUBLIC',
    'AUTHENTICATED',
    'PARTICIPANT_CONTROLLED',
    'ORGANISATION_PRIVATE',
    'SENSITIVE',
    'SYSTEM_INTERNAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StoredAssetStatus" AS ENUM (
    'pending',
    'ready',
    'deleted'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StorageUploadSessionStatus" AS ENUM (
    'pending',
    'completed',
    'expired',
    'orphaned'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StorageRetentionClass" AS ENUM (
    'standard',
    'evidence',
    'short_lived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "stored_assets" (
    "id" TEXT NOT NULL,
    "organisation_id" TEXT,
    "provider" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" TEXT,
    "access_classification" "StorageAccessClassification" NOT NULL,
    "source_type" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "retention_class" "StorageRetentionClass" NOT NULL DEFAULT 'standard',
    "status" "StoredAssetStatus" NOT NULL DEFAULT 'pending',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stored_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "storage_upload_sessions" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "declared_size_bytes" INTEGER NOT NULL,
    "access_classification" "StorageAccessClassification" NOT NULL,
    "nonce_hash" TEXT NOT NULL,
    "status" "StorageUploadSessionStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "actor_user_id" TEXT NOT NULL,
    "organisation_id" TEXT,
    "place_id" TEXT,
    "observation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_upload_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "access_observation_evidence" (
    "id" TEXT NOT NULL,
    "observation_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "evidence_kind" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_observation_evidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stored_assets_provider_bucket_object_key_key"
  ON "stored_assets"("provider", "bucket", "object_key");
CREATE INDEX IF NOT EXISTS "stored_assets_organisation_id_idx" ON "stored_assets"("organisation_id");
CREATE INDEX IF NOT EXISTS "stored_assets_created_by_id_idx" ON "stored_assets"("created_by_id");
CREATE INDEX IF NOT EXISTS "stored_assets_status_created_at_idx" ON "stored_assets"("status", "created_at");

CREATE INDEX IF NOT EXISTS "storage_upload_sessions_asset_id_idx" ON "storage_upload_sessions"("asset_id");
CREATE INDEX IF NOT EXISTS "storage_upload_sessions_actor_user_id_status_idx" ON "storage_upload_sessions"("actor_user_id", "status");
CREATE INDEX IF NOT EXISTS "storage_upload_sessions_status_expires_at_idx" ON "storage_upload_sessions"("status", "expires_at");

CREATE UNIQUE INDEX IF NOT EXISTS "access_observation_evidence_observation_id_asset_id_key"
  ON "access_observation_evidence"("observation_id", "asset_id");
CREATE INDEX IF NOT EXISTS "access_observation_evidence_asset_id_idx" ON "access_observation_evidence"("asset_id");

DO $$ BEGIN
  ALTER TABLE "stored_assets"
    ADD CONSTRAINT "stored_assets_organisation_id_fkey"
    FOREIGN KEY ("organisation_id") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "stored_assets"
    ADD CONSTRAINT "stored_assets_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "storage_upload_sessions"
    ADD CONSTRAINT "storage_upload_sessions_asset_id_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "stored_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "storage_upload_sessions"
    ADD CONSTRAINT "storage_upload_sessions_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "storage_upload_sessions"
    ADD CONSTRAINT "storage_upload_sessions_organisation_id_fkey"
    FOREIGN KEY ("organisation_id") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "access_observation_evidence"
    ADD CONSTRAINT "access_observation_evidence_observation_id_fkey"
    FOREIGN KEY ("observation_id") REFERENCES "access_observation_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "access_observation_evidence"
    ADD CONSTRAINT "access_observation_evidence_asset_id_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "stored_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
