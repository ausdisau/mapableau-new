-- Reporting & audit trail system migration

-- Extend MapAbleUserRole enum
ALTER TYPE "MapAbleUserRole" ADD VALUE IF NOT EXISTS 'quality_lead';
ALTER TYPE "MapAbleUserRole" ADD VALUE IF NOT EXISTS 'finance_lead';
ALTER TYPE "MapAbleUserRole" ADD VALUE IF NOT EXISTS 'board_viewer';

-- New enums
CREATE TYPE "AuditRiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE "AuditOutcome" AS ENUM ('success', 'denied', 'partial', 'error');
CREATE TYPE "DataAccessResult" AS ENUM ('allowed', 'denied');
CREATE TYPE "SensitivityLevel" AS ENUM ('public', 'internal', 'confidential', 'restricted');
CREATE TYPE "ReportCategory" AS ENUM (
  'participant_activity', 'provider_operations', 'care_delivery', 'transport_delivery',
  'employment_outcomes', 'marketplace_activity', 'food_delivery', 'billing_finance',
  'plan_manager_review', 'quality_safeguards', 'privacy_security', 'peer_community',
  'access_map', 'board_pack'
);
CREATE TYPE "ReportRunStatus" AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE "ReportExportFormat" AS ENUM ('csv', 'pdf', 'json');
CREATE TYPE "PrivacyBreachStatus" AS ENUM ('draft', 'investigating', 'notifiable', 'closed');

-- Rename ReportingSnapshot table if needed
ALTER TABLE IF EXISTS "ReportingSnapshot" RENAME TO "reporting_snapshots";

-- audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "actor_role" "MapAbleUserRole",
  "organisation_id" TEXT,
  "action" TEXT NOT NULL,
  "domain" TEXT,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "participant_id" TEXT,
  "provider_id" TEXT,
  "before_json" JSONB,
  "after_json" JSONB,
  "risk_level" "AuditRiskLevel" NOT NULL DEFAULT 'low',
  "outcome" "AuditOutcome" NOT NULL DEFAULT 'success',
  "reason" TEXT,
  "metadata" JSONB,
  "request_id" TEXT,
  "correlation_id" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "previous_hash" TEXT,
  "record_hash" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_logs_domain_entity_type_entity_id_created_at_idx"
  ON "audit_logs"("domain", "entity_type", "entity_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_participant_id_created_at_idx"
  ON "audit_logs"("participant_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_organisation_id_created_at_idx"
  ON "audit_logs"("organisation_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_action_created_at_idx"
  ON "audit_logs"("action", "created_at");

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organisation_id_fkey"
  FOREIGN KEY ("organisation_id") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- data_access_logs
CREATE TABLE IF NOT EXISTS "data_access_logs" (
  "id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "actor_role" "MapAbleUserRole",
  "organisation_id" TEXT,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "participant_id" TEXT,
  "sensitivity_level" "SensitivityLevel" NOT NULL DEFAULT 'internal',
  "consent_grant_id" TEXT,
  "access_reason" TEXT,
  "result" "DataAccessResult" NOT NULL DEFAULT 'allowed',
  "metadata" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "data_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "data_access_logs_participant_id_created_at_idx"
  ON "data_access_logs"("participant_id", "created_at");
CREATE INDEX IF NOT EXISTS "data_access_logs_organisation_id_created_at_idx"
  ON "data_access_logs"("organisation_id", "created_at");
CREATE INDEX IF NOT EXISTS "data_access_logs_actor_user_id_created_at_idx"
  ON "data_access_logs"("actor_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "data_access_logs_entity_type_entity_id_created_at_idx"
  ON "data_access_logs"("entity_type", "entity_id", "created_at");

ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_organisation_id_fkey"
  FOREIGN KEY ("organisation_id") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- domain_events
CREATE TABLE IF NOT EXISTS "domain_events" (
  "id" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "participant_id" TEXT,
  "organisation_id" TEXT,
  "actor_user_id" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "correlation_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "domain_events_entity_type_entity_id_created_at_idx"
  ON "domain_events"("entity_type", "entity_id", "created_at");
CREATE INDEX IF NOT EXISTS "domain_events_participant_id_created_at_idx"
  ON "domain_events"("participant_id", "created_at");
CREATE INDEX IF NOT EXISTS "domain_events_domain_created_at_idx"
  ON "domain_events"("domain", "created_at");

ALTER TABLE "domain_events" ADD CONSTRAINT "domain_events_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- report_definitions
CREATE TABLE IF NOT EXISTS "report_definitions" (
  "id" TEXT NOT NULL,
  "report_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" "ReportCategory" NOT NULL,
  "deidentified" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "config_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "report_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "report_definitions_report_key_key" ON "report_definitions"("report_key");

-- report_runs
CREATE TABLE IF NOT EXISTS "report_runs" (
  "id" TEXT NOT NULL,
  "report_definition_id" TEXT NOT NULL,
  "report_key" TEXT NOT NULL,
  "status" "ReportRunStatus" NOT NULL DEFAULT 'pending',
  "parameters_json" JSONB,
  "result_summary_json" JSONB,
  "organisation_id" TEXT,
  "actor_user_id" TEXT NOT NULL,
  "error_message" TEXT,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "report_runs_report_key_created_at_idx" ON "report_runs"("report_key", "created_at");
CREATE INDEX IF NOT EXISTS "report_runs_organisation_id_created_at_idx" ON "report_runs"("organisation_id", "created_at");

ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_report_definition_id_fkey"
  FOREIGN KEY ("report_definition_id") REFERENCES "report_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_organisation_id_fkey"
  FOREIGN KEY ("organisation_id") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- reporting_snapshots: add report_run_id
ALTER TABLE "reporting_snapshots" ADD COLUMN IF NOT EXISTS "report_run_id" TEXT;
ALTER TABLE "reporting_snapshots" DROP CONSTRAINT IF EXISTS "reporting_snapshots_report_run_id_fkey";
ALTER TABLE "reporting_snapshots" ADD CONSTRAINT "reporting_snapshots_report_run_id_fkey"
  FOREIGN KEY ("report_run_id") REFERENCES "report_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- report_exports
CREATE TABLE IF NOT EXISTS "report_exports" (
  "id" TEXT NOT NULL,
  "report_run_id" TEXT NOT NULL,
  "format" "ReportExportFormat" NOT NULL DEFAULT 'csv',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "row_count" INTEGER,
  "file_name" TEXT,
  "purpose" TEXT,
  "actor_user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "report_exports_report_run_id_created_at_idx"
  ON "report_exports"("report_run_id", "created_at");

ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_report_run_id_fkey"
  FOREIGN KEY ("report_run_id") REFERENCES "report_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- report_export_events
CREATE TABLE IF NOT EXISTS "report_export_events" (
  "id" TEXT NOT NULL,
  "export_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_export_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "report_export_events_export_id_created_at_idx"
  ON "report_export_events"("export_id", "created_at");

ALTER TABLE "report_export_events" ADD CONSTRAINT "report_export_events_export_id_fkey"
  FOREIGN KEY ("export_id") REFERENCES "report_exports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- privacy breach tables
CREATE TABLE IF NOT EXISTS "privacy_breach_records" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "PrivacyBreachStatus" NOT NULL DEFAULT 'draft',
  "discovered_at" TIMESTAMP(3) NOT NULL,
  "reported_at" TIMESTAMP(3),
  "notifiable" BOOLEAN NOT NULL DEFAULT false,
  "remediation_notes" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "privacy_breach_records_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "privacy_breach_records" ADD CONSTRAINT "privacy_breach_records_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "privacy_breach_events" (
  "id" TEXT NOT NULL,
  "breach_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "privacy_breach_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "privacy_breach_events_breach_id_created_at_idx"
  ON "privacy_breach_events"("breach_id", "created_at");

ALTER TABLE "privacy_breach_events" ADD CONSTRAINT "privacy_breach_events_breach_id_fkey"
  FOREIGN KEY ("breach_id") REFERENCES "privacy_breach_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "affected_people_records" (
  "id" TEXT NOT NULL,
  "breach_id" TEXT NOT NULL,
  "participant_id" TEXT,
  "role_label" TEXT,
  "impact_summary" TEXT,
  "notified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "affected_people_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "affected_people_records_breach_id_idx" ON "affected_people_records"("breach_id");

ALTER TABLE "affected_people_records" ADD CONSTRAINT "affected_people_records_breach_id_fkey"
  FOREIGN KEY ("breach_id") REFERENCES "privacy_breach_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- audit_log_integrity_batches
CREATE TABLE IF NOT EXISTS "audit_log_integrity_batches" (
  "id" TEXT NOT NULL,
  "batch_number" INTEGER NOT NULL,
  "start_log_id" TEXT,
  "end_log_id" TEXT,
  "record_count" INTEGER NOT NULL,
  "batch_hash" TEXT NOT NULL,
  "previous_batch_hash" TEXT,
  "sealed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_log_integrity_batches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "audit_log_integrity_batches_batch_number_key"
  ON "audit_log_integrity_batches"("batch_number");

-- Migrate historical AuditEvent rows
INSERT INTO "audit_logs" (
  "id", "actor_user_id", "actor_role", "organisation_id", "action", "domain",
  "entity_type", "entity_id", "participant_id", "metadata", "ip_address", "user_agent", "created_at"
)
SELECT
  "id", "actorUserId", "actorRole", "organisationId", "action",
  COALESCE("metadata"->>'domain', 'platform'),
  "entityType", "entityId", "participantId", "metadata", "ipAddress", "userAgent", "createdAt"
FROM "AuditEvent"
ON CONFLICT ("id") DO NOTHING;

-- Append-only triggers
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_no_update ON "audit_logs";
DROP TRIGGER IF EXISTS audit_logs_no_delete ON "audit_logs";
CREATE TRIGGER audit_logs_no_update BEFORE UPDATE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
CREATE TRIGGER audit_logs_no_delete BEFORE DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE OR REPLACE FUNCTION prevent_data_access_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'data_access_logs is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS data_access_logs_no_update ON "data_access_logs";
DROP TRIGGER IF EXISTS data_access_logs_no_delete ON "data_access_logs";
CREATE TRIGGER data_access_logs_no_update BEFORE UPDATE ON "data_access_logs"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
CREATE TRIGGER data_access_logs_no_delete BEFORE DELETE ON "data_access_logs"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE OR REPLACE FUNCTION prevent_domain_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'domain_events is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS domain_events_no_update ON "domain_events";
DROP TRIGGER IF EXISTS domain_events_no_delete ON "domain_events";
CREATE TRIGGER domain_events_no_update BEFORE UPDATE ON "domain_events"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
CREATE TRIGGER domain_events_no_delete BEFORE DELETE ON "domain_events"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE OR REPLACE FUNCTION prevent_report_export_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'report_export_events is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS report_export_events_no_update ON "report_export_events";
DROP TRIGGER IF EXISTS report_export_events_no_delete ON "report_export_events";
CREATE TRIGGER report_export_events_no_update BEFORE UPDATE ON "report_export_events"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
CREATE TRIGGER report_export_events_no_delete BEFORE DELETE ON "report_export_events"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE OR REPLACE FUNCTION prevent_integrity_batch_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log_integrity_batches is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_integrity_batches_no_update ON "audit_log_integrity_batches";
DROP TRIGGER IF EXISTS audit_log_integrity_batches_no_delete ON "audit_log_integrity_batches";
CREATE TRIGGER audit_log_integrity_batches_no_update BEFORE UPDATE ON "audit_log_integrity_batches"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
CREATE TRIGGER audit_log_integrity_batches_no_delete BEFORE DELETE ON "audit_log_integrity_batches"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
