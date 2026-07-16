-- Wave 0: bind Access Intelligence to canonical AccessPlace / AccessibilityProfile / AuditEvent

-- Consent scopes for Access Intelligence disclosures
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'access_passport_share';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'access_visit_plan_share';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'access_venue_verification';

-- AccessibilityProfile default passport pointer
ALTER TABLE "AccessibilityProfile" ADD COLUMN IF NOT EXISTS "default_passport_id" TEXT;
CREATE INDEX IF NOT EXISTS "AccessibilityProfile_default_passport_id_idx" ON "AccessibilityProfile"("default_passport_id");

-- Passport → AccessibilityProfile
ALTER TABLE "ai_access_passports" ADD COLUMN IF NOT EXISTS "accessibility_profile_id" TEXT;
CREATE INDEX IF NOT EXISTS "ai_access_passports_accessibility_profile_id_idx" ON "ai_access_passports"("accessibility_profile_id");

-- AiAccessPlace → AccessPlace
ALTER TABLE "ai_access_places" ADD COLUMN IF NOT EXISTS "canonical_access_place_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ai_access_places_canonical_access_place_id_key" ON "ai_access_places"("canonical_access_place_id");

-- Visit plans → AccessPlace
ALTER TABLE "ai_visit_plans" ADD COLUMN IF NOT EXISTS "access_place_id" TEXT;
CREATE INDEX IF NOT EXISTS "ai_visit_plans_access_place_id_idx" ON "ai_visit_plans"("access_place_id");

-- Living twin meta → AccessPlace
ALTER TABLE "ai_living_twin_meta" ADD COLUMN IF NOT EXISTS "canonical_access_place_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ai_living_twin_meta_canonical_access_place_id_key" ON "ai_living_twin_meta"("canonical_access_place_id");

-- Audit correlation on module-local audit mirror
ALTER TABLE "ai_access_audit_events" ADD COLUMN IF NOT EXISTS "correlation_id" TEXT;
CREATE INDEX IF NOT EXISTS "ai_access_audit_events_correlation_id_idx" ON "ai_access_audit_events"("correlation_id");

-- FKs (idempotent-ish: ignore if already present via DO block)
DO $$ BEGIN
  ALTER TABLE "ai_access_places"
    ADD CONSTRAINT "ai_access_places_canonical_access_place_id_fkey"
    FOREIGN KEY ("canonical_access_place_id") REFERENCES "access_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ai_visit_plans"
    ADD CONSTRAINT "ai_visit_plans_access_place_id_fkey"
    FOREIGN KEY ("access_place_id") REFERENCES "access_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ai_living_twin_meta"
    ADD CONSTRAINT "ai_living_twin_meta_canonical_access_place_id_fkey"
    FOREIGN KEY ("canonical_access_place_id") REFERENCES "access_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
