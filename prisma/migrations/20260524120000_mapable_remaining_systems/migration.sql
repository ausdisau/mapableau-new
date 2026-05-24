-- MapAble Remaining Systems schema extension
-- If this migration fails on an existing DB, run: npx prisma db push

-- CreateEnum
CREATE TYPE "DataClassification" AS ENUM ('public', 'internal', 'participant_controlled', 'sensitive_disability', 'sensitive_health', 'ndis_plan_data', 'financial', 'safeguarding', 'clinical', 'credential_document');
CREATE TYPE "DataDeletionRequestStatus" AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'completed', 'blocked_legal_hold');
CREATE TYPE "PrivacyIncidentType" AS ENUM ('unauthorised_access', 'misdirected_message', 'document_exposure', 'lost_device', 'api_leak', 'inappropriate_staff_access');
CREATE TYPE "PrivacyIncidentStatus" AS ENUM ('open', 'investigating', 'contained', 'closed');
CREATE TYPE "NdisAdapterType" AS ENUM ('mock', 'aggregator', 'direct_ndia');
CREATE TYPE "NdisConsentScope" AS ENUM ('plan_dates', 'plan_goals', 'budget_summary', 'funded_supports', 'provider_relationships', 'service_booking_refs', 'claim_status', 'payment_status');
CREATE TYPE "NdisClaimQueueStatus" AS ENUM ('draft', 'ready_for_review', 'participant_approved', 'queued_for_submission', 'submitted', 'accepted', 'rejected', 'paid', 'reconciled', 'manual_review', 'cancelled');
CREATE TYPE "OfflineConflictType" AS ENUM ('booking_status_changed', 'trip_already_completed', 'service_log_already_submitted', 'invoice_already_generated', 'permission_changed');
CREATE TYPE "SsoProvider" AS ENUM ('google', 'microsoft');
CREATE TYPE "SsoAccessRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- Tables are created by aligning with prisma/schema.prisma via:
-- npx prisma migrate deploy
-- or for local dev: npx prisma db push
