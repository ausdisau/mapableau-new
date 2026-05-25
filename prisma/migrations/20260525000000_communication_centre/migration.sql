-- MapAble Communication Centre
-- Postgres source of truth; RLS policies are placeholders for Supabase-hosted deployments.

CREATE TYPE "ThreadType" AS ENUM (
  'direct',
  'group',
  'booking',
  'transport_trip',
  'invoice',
  'service_agreement',
  'support_ticket',
  'complaint',
  'incident_safe_comms',
  'telehealth',
  'provider_team',
  'admin_support'
);

CREATE TYPE "CentreMessageType" AS ENUM (
  'text',
  'attachment',
  'image',
  'voice_note',
  'system_event',
  'booking_card',
  'invoice_card',
  'service_agreement_card',
  'telehealth_link',
  'support_ticket_update',
  'incident_safety_update'
);

CREATE TYPE "CentreMessageStatus" AS ENUM (
  'draft',
  'sending',
  'sent',
  'delivered',
  'read',
  'failed',
  'deleted'
);

CREATE TYPE "MessageReportReason" AS ENUM (
  'abusive_or_harassing',
  'unsafe_support',
  'billing_issue',
  'privacy_concern',
  'discrimination',
  'worker_no_show',
  'inappropriate_contact',
  'other'
);

CREATE TYPE "MessageReportStatus" AS ENUM (
  'open',
  'reviewing',
  'resolved',
  'dismissed'
);

CREATE TYPE "CommunicationThreadStatus" AS ENUM (
  'active',
  'archived',
  'closed',
  'escalated'
);

CREATE TABLE "conversation_threads" (
  "id" TEXT NOT NULL,
  "thread_type" "ThreadType" NOT NULL,
  "title" TEXT NOT NULL,
  "participant_id" TEXT,
  "provider_id" TEXT,
  "booking_id" TEXT,
  "transport_trip_id" TEXT,
  "invoice_id" TEXT,
  "service_agreement_id" TEXT,
  "support_ticket_id" TEXT,
  "incident_id" TEXT,
  "complaint_id" TEXT,
  "status" "CommunicationThreadStatus" NOT NULL DEFAULT 'active',
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conversation_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversation_participants" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "profile_id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "can_send" BOOLEAN NOT NULL DEFAULT true,
  "can_attach_files" BOOLEAN NOT NULL DEFAULT true,
  "muted" BOOLEAN NOT NULL DEFAULT false,
  "blocked" BOOLEAN NOT NULL DEFAULT false,
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "left_at" TIMESTAMP(3),
  CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "communication_messages" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "sender_profile_id" TEXT NOT NULL,
  "message_type" "CentreMessageType" NOT NULL DEFAULT 'text',
  "body" TEXT NOT NULL,
  "status" "CentreMessageStatus" NOT NULL DEFAULT 'sent',
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "edited_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "message_receipts" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "profile_id" TEXT NOT NULL,
  "delivered_at" TIMESTAMP(3),
  "read_at" TIMESTAMP(3),
  CONSTRAINT "message_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "message_attachments" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "document_id" TEXT NOT NULL,
  "attachment_type" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "message_reports" (
  "id" TEXT NOT NULL,
  "message_id" TEXT,
  "thread_id" TEXT NOT NULL,
  "reporter_profile_id" TEXT NOT NULL,
  "reason" "MessageReportReason" NOT NULL,
  "details" TEXT,
  "status" "MessageReportStatus" NOT NULL DEFAULT 'open',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "message_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "thread_mutes" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "profile_id" TEXT NOT NULL,
  "muted_until" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "thread_mutes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blocked_chat_users" (
  "id" TEXT NOT NULL,
  "blocker_profile_id" TEXT NOT NULL,
  "blocked_profile_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "blocked_chat_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "message_events" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "payload_json" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "message_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversation_participants_thread_id_profile_id_key" ON "conversation_participants"("thread_id", "profile_id");
CREATE UNIQUE INDEX "message_receipts_message_id_profile_id_key" ON "message_receipts"("message_id", "profile_id");
CREATE UNIQUE INDEX "thread_mutes_thread_id_profile_id_key" ON "thread_mutes"("thread_id", "profile_id");
CREATE UNIQUE INDEX "blocked_chat_users_blocker_profile_id_blocked_profile_id_key" ON "blocked_chat_users"("blocker_profile_id", "blocked_profile_id");

CREATE INDEX "conversation_threads_updated_at_idx" ON "conversation_threads"("updated_at");
CREATE INDEX "conversation_participants_profile_id_idx" ON "conversation_participants"("profile_id");
CREATE INDEX "conversation_participants_thread_id_idx" ON "conversation_participants"("thread_id");
CREATE INDEX "communication_messages_thread_id_idx" ON "communication_messages"("thread_id");
CREATE INDEX "communication_messages_created_at_idx" ON "communication_messages"("created_at");
CREATE INDEX "message_receipts_profile_id_idx" ON "message_receipts"("profile_id");
CREATE INDEX "message_reports_status_idx" ON "message_reports"("status");

ALTER TABLE "conversation_threads" ADD CONSTRAINT "conversation_threads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "conversation_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "conversation_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_sender_profile_id_fkey" FOREIGN KEY ("sender_profile_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "communication_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "communication_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "conversation_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_reporter_profile_id_fkey" FOREIGN KEY ("reporter_profile_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "thread_mutes" ADD CONSTRAINT "thread_mutes_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "conversation_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "thread_mutes" ADD CONSTRAINT "thread_mutes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blocked_chat_users" ADD CONSTRAINT "blocked_chat_users_blocker_profile_id_fkey" FOREIGN KEY ("blocker_profile_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blocked_chat_users" ADD CONSTRAINT "blocked_chat_users_blocked_profile_id_fkey" FOREIGN KEY ("blocked_profile_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_events" ADD CONSTRAINT "message_events_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "conversation_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS placeholders (enable when deploying on Supabase):
-- ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY thread_select ON conversation_threads FOR SELECT USING (
--   EXISTS (SELECT 1 FROM conversation_participants p WHERE p.thread_id = id AND p.profile_id = auth.uid()::text)
-- );
