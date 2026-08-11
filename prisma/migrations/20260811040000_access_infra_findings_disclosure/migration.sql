-- Access Infrastructure Phase 1: findings, disclosure, change events (additive).

CREATE TYPE "AccessFindingResult" AS ENUM (
  'match',
  'mismatch',
  'unknown',
  'adjustment_available'
);

CREATE TYPE "AccessDisclosureRecipientRole" AS ENUM (
  'care_worker',
  'care_provider',
  'transport_operator',
  'driver',
  'employer',
  'workplace_contact',
  'support_coordinator',
  'delegate',
  'emergency',
  'venue',
  'other'
);

CREATE TYPE "AccessChangeEventType" AS ENUM (
  'requirement_created',
  'requirement_updated',
  'requirement_deleted',
  'disclosure_policy_updated',
  'disclosure_confirmed',
  'disclosure_revoked',
  'observation_created',
  'observation_disputed',
  'observation_verified',
  'compatibility_evaluated',
  'compatibility_invalidated',
  'passport_updated'
);

CREATE TABLE "access_compatibility_finding_records" (
  "id" TEXT NOT NULL,
  "assessment_id" TEXT NOT NULL,
  "requirement_id" TEXT,
  "ontology_concept_id" TEXT NOT NULL,
  "result" "AccessFindingResult" NOT NULL,
  "capability_id" TEXT,
  "observation_id" TEXT,
  "adjustment_id" TEXT,
  "reason_code" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "requires_confirmation" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "access_compatibility_finding_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_compatibility_finding_records_assessment_id_idx"
  ON "access_compatibility_finding_records"("assessment_id");
CREATE INDEX "access_compatibility_finding_records_ontology_concept_id_result_idx"
  ON "access_compatibility_finding_records"("ontology_concept_id", "result");

CREATE TABLE "access_disclosure_policy_records" (
  "id" TEXT NOT NULL,
  "passport_id" TEXT NOT NULL,
  "recipient_role" "AccessDisclosureRecipientRole" NOT NULL,
  "purpose" TEXT NOT NULL,
  "allowed_attributes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "expires_at" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "access_disclosure_policy_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_disclosure_policy_records_passport_id_recipient_role_active_idx"
  ON "access_disclosure_policy_records"("passport_id", "recipient_role", "active");

CREATE TABLE "access_disclosure_receipt_records" (
  "id" TEXT NOT NULL,
  "passport_id" TEXT NOT NULL,
  "policy_id" TEXT,
  "disclosed_by_user_id" TEXT NOT NULL,
  "recipient_role" "AccessDisclosureRecipientRole" NOT NULL,
  "recipient_ref" TEXT,
  "purpose" TEXT NOT NULL,
  "attribute_keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "consent_record_id" TEXT,
  "consent_version" TEXT,
  "trust_fabric_receipt_id" TEXT,
  "disclosed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "revoked_by_user_id" TEXT,

  CONSTRAINT "access_disclosure_receipt_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_disclosure_receipt_records_passport_id_disclosed_at_idx"
  ON "access_disclosure_receipt_records"("passport_id", "disclosed_at");
CREATE INDEX "access_disclosure_receipt_records_recipient_role_disclosed_at_idx"
  ON "access_disclosure_receipt_records"("recipient_role", "disclosed_at");

CREATE TABLE "access_change_event_records" (
  "id" TEXT NOT NULL,
  "passport_id" TEXT NOT NULL,
  "event_type" "AccessChangeEventType" NOT NULL,
  "actor_user_id" TEXT,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "summary" TEXT NOT NULL,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "access_change_event_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_change_event_records_passport_id_created_at_idx"
  ON "access_change_event_records"("passport_id", "created_at");
CREATE INDEX "access_change_event_records_event_type_created_at_idx"
  ON "access_change_event_records"("event_type", "created_at");

ALTER TABLE "access_compatibility_finding_records"
  ADD CONSTRAINT "access_compatibility_finding_records_assessment_id_fkey"
  FOREIGN KEY ("assessment_id") REFERENCES "access_compatibility_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_compatibility_finding_records"
  ADD CONSTRAINT "access_compatibility_finding_records_requirement_id_fkey"
  FOREIGN KEY ("requirement_id") REFERENCES "access_requirement_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_compatibility_finding_records"
  ADD CONSTRAINT "access_compatibility_finding_records_capability_id_fkey"
  FOREIGN KEY ("capability_id") REFERENCES "access_capability_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_compatibility_finding_records"
  ADD CONSTRAINT "access_compatibility_finding_records_observation_id_fkey"
  FOREIGN KEY ("observation_id") REFERENCES "access_observation_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_compatibility_finding_records"
  ADD CONSTRAINT "access_compatibility_finding_records_adjustment_id_fkey"
  FOREIGN KEY ("adjustment_id") REFERENCES "access_adjustment_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_disclosure_policy_records"
  ADD CONSTRAINT "access_disclosure_policy_records_passport_id_fkey"
  FOREIGN KEY ("passport_id") REFERENCES "access_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_disclosure_receipt_records"
  ADD CONSTRAINT "access_disclosure_receipt_records_passport_id_fkey"
  FOREIGN KEY ("passport_id") REFERENCES "access_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_disclosure_receipt_records"
  ADD CONSTRAINT "access_disclosure_receipt_records_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "access_disclosure_policy_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_change_event_records"
  ADD CONSTRAINT "access_change_event_records_passport_id_fkey"
  FOREIGN KEY ("passport_id") REFERENCES "access_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
