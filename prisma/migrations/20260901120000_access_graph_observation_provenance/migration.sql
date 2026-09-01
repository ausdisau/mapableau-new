-- Access Graph observation provenance extensions (Epic 01 / Prompt 01)
ALTER TABLE "access_observation_records" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
ALTER TABLE "access_observation_records" ADD COLUMN IF NOT EXISTS "dispute_history" JSONB;
