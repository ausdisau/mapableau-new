-- MapAble Four Modules: Support Coordination, Plan Manager, Family/Nominee, Home Modifications

-- Shared audit extensions
CREATE TABLE "data_access_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" "MapAbleUserRole",
    "participantId" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "action" TEXT NOT NULL,
    "consentStatus" TEXT NOT NULL DEFAULT 'unknown',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "data_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "participantId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- Module 1: Support Coordination
CREATE TYPE "SupportCoordinationReferralStatus" AS ENUM ('draft', 'pending_participant_approval', 'approved', 'sent_to_provider', 'declined', 'converted_to_booking', 'closed');

CREATE TABLE "support_coordinator_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisationId" TEXT,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "support_coordinator_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_coordination_notes" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "relationshipId" TEXT,
    "content" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'coordinator_participant',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "support_coordination_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_coordination_referrals" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "providerId" TEXT,
    "organisationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SupportCoordinationReferralStatus" NOT NULL DEFAULT 'draft',
    "participantApprovedAt" TIMESTAMP(3),
    "bookingId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "support_coordination_referrals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "referral_events" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "goal_progress_updates" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "coordinatorId" TEXT,
    "goalTitle" TEXT NOT NULL,
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "goal_progress_updates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_review_reminders" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "coordinatorId" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "plan_review_reminders_pkey" PRIMARY KEY ("id")
);

-- Module 2: Plan Manager
CREATE TABLE "plan_manager_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisationId" TEXT,
    "displayName" TEXT NOT NULL,
    "abn" TEXT,
    "contactEmail" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "plan_manager_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TYPE "PlanManagerInboxStatus" AS ENUM ('pending', 'in_review', 'needs_information', 'approved', 'disputed', 'processing', 'paid', 'closed');

CREATE TABLE "plan_manager_invoice_inbox" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "planManagerId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "PlanManagerInboxStatus" NOT NULL DEFAULT 'pending',
    "claimWarnings" JSONB,
    "ndisLineItems" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "plan_manager_invoice_inbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_review_events" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "planManagerId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_review_events_pkey" PRIMARY KEY ("id")
);

CREATE TYPE "PaymentProcessingStatus" AS ENUM ('not_started', 'processing', 'paid', 'failed', 'disputed');

CREATE TABLE "payment_processing_records" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "planManagerId" TEXT NOT NULL,
    "status" "PaymentProcessingStatus" NOT NULL DEFAULT 'not_started',
    "processedAt" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_processing_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_manager_notes" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "planManagerId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plan_manager_notes_pkey" PRIMARY KEY ("id")
);

-- Module 3: Family / Nominee
CREATE TYPE "NomineeLinkStatus" AS ENUM ('pending', 'active', 'revoked');
CREATE TYPE "NomineePermissionScope" AS ENUM ('view_dashboard', 'view_bookings', 'create_booking_draft', 'approve_invoice', 'view_documents', 'message_providers', 'view_emergency_profile', 'manage_notifications', 'view_service_history', 'support_plan_review');

CREATE TABLE "nominee_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "relationship" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "nominee_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "participant_nominee_links" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "nomineeId" TEXT NOT NULL,
    "status" "NomineeLinkStatus" NOT NULL DEFAULT 'pending',
    "invitedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "participant_nominee_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nominee_permissions" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "scope" "NomineePermissionScope" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "nominee_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nominee_action_logs" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "nomineeId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nominee_action_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "family_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "family_notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supported_decision_records" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "supporterId" TEXT NOT NULL,
    "linkId" TEXT,
    "decisionType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "participantConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "supported_decision_records_pkey" PRIMARY KEY ("id")
);

-- Module 4: Home Modifications
CREATE TYPE "HomeModificationRequestStatus" AS ENUM ('draft', 'submitted', 'assessment_booked', 'quotes_requested', 'quote_accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "HomeModificationQuoteStatus" AS ENUM ('requested', 'received', 'accepted', 'declined', 'expired');
CREATE TYPE "HomeModificationProjectStatus" AS ENUM ('planning', 'assessment', 'quoting', 'approved', 'installation', 'completed', 'on_hold');
CREATE TYPE "ProjectMilestoneStatus" AS ENUM ('pending', 'in_progress', 'completed', 'blocked');
CREATE TYPE "HomeModificationDocumentVisibility" AS ENUM ('private_to_participant', 'shared_with_coordinator', 'shared_with_provider', 'shared_with_plan_manager');

CREATE TABLE "home_modification_requests" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "addressSummary" TEXT,
    "status" "HomeModificationRequestStatus" NOT NULL DEFAULT 'draft',
    "fundingNotes" TEXT,
    "consentDocumentAccess" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "home_modification_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "home_access_issues" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'moderate',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "home_access_issues_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "home_modification_assessments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "assessorId" TEXT,
    "bookingId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "home_modification_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "home_modification_quotes" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "organisationId" TEXT,
    "title" TEXT NOT NULL,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "breakdownJson" JSONB,
    "status" "HomeModificationQuoteStatus" NOT NULL DEFAULT 'requested',
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "home_modification_quotes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "home_modification_projects" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "providerId" TEXT,
    "title" TEXT NOT NULL,
    "status" "HomeModificationProjectStatus" NOT NULL DEFAULT 'planning',
    "fundingNotes" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "home_modification_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ProjectMilestoneStatus" NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "home_modification_documents" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "storageKey" TEXT,
    "documentType" TEXT NOT NULL DEFAULT 'photo',
    "visibility" "HomeModificationDocumentVisibility" NOT NULL DEFAULT 'private_to_participant',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "home_modification_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "home_modification_provider_profiles" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "specialisations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "home_modification_provider_profiles_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "support_coordinator_profiles_userId_key" ON "support_coordinator_profiles"("userId");
CREATE UNIQUE INDEX "plan_manager_profiles_userId_key" ON "plan_manager_profiles"("userId");
CREATE UNIQUE INDEX "plan_manager_invoice_inbox_invoiceId_planManagerId_key" ON "plan_manager_invoice_inbox"("invoiceId", "planManagerId");
CREATE UNIQUE INDEX "nominee_profiles_userId_key" ON "nominee_profiles"("userId");
CREATE UNIQUE INDEX "participant_nominee_links_participantId_nomineeId_key" ON "participant_nominee_links"("participantId", "nomineeId");
CREATE UNIQUE INDEX "nominee_permissions_linkId_scope_key" ON "nominee_permissions"("linkId", "scope");
CREATE UNIQUE INDEX "home_modification_provider_profiles_organisationId_key" ON "home_modification_provider_profiles"("organisationId");

-- Foreign keys
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "support_coordination_referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "home_access_issues" ADD CONSTRAINT "home_access_issues_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "home_modification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "home_modification_assessments" ADD CONSTRAINT "home_modification_assessments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "home_modification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "home_modification_quotes" ADD CONSTRAINT "home_modification_quotes_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "home_modification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "home_modification_projects" ADD CONSTRAINT "home_modification_projects_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "home_modification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "home_modification_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "home_modification_documents" ADD CONSTRAINT "home_modification_documents_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "home_modification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nominee_permissions" ADD CONSTRAINT "nominee_permissions_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "participant_nominee_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "data_access_logs_participantId_idx" ON "data_access_logs"("participantId");
CREATE INDEX "data_access_logs_actorUserId_idx" ON "data_access_logs"("actorUserId");
CREATE INDEX "data_access_logs_resourceType_resourceId_idx" ON "data_access_logs"("resourceType", "resourceId");
CREATE INDEX "data_access_logs_createdAt_idx" ON "data_access_logs"("createdAt");
CREATE INDEX "notification_events_userId_idx" ON "notification_events"("userId");
CREATE INDEX "notification_events_participantId_idx" ON "notification_events"("participantId");
CREATE INDEX "notification_events_createdAt_idx" ON "notification_events"("createdAt");
CREATE INDEX "support_coordinator_profiles_userId_idx" ON "support_coordinator_profiles"("userId");
CREATE INDEX "support_coordinator_profiles_organisationId_idx" ON "support_coordinator_profiles"("organisationId");
CREATE INDEX "support_coordination_notes_participantId_idx" ON "support_coordination_notes"("participantId");
CREATE INDEX "support_coordination_notes_coordinatorId_idx" ON "support_coordination_notes"("coordinatorId");
CREATE INDEX "support_coordination_notes_createdAt_idx" ON "support_coordination_notes"("createdAt");
CREATE INDEX "support_coordination_referrals_participantId_idx" ON "support_coordination_referrals"("participantId");
CREATE INDEX "support_coordination_referrals_coordinatorId_idx" ON "support_coordination_referrals"("coordinatorId");
CREATE INDEX "support_coordination_referrals_providerId_idx" ON "support_coordination_referrals"("providerId");
CREATE INDEX "support_coordination_referrals_status_idx" ON "support_coordination_referrals"("status");
CREATE INDEX "support_coordination_referrals_createdAt_idx" ON "support_coordination_referrals"("createdAt");
CREATE INDEX "referral_events_referralId_idx" ON "referral_events"("referralId");
CREATE INDEX "referral_events_createdAt_idx" ON "referral_events"("createdAt");
CREATE INDEX "goal_progress_updates_participantId_idx" ON "goal_progress_updates"("participantId");
CREATE INDEX "goal_progress_updates_coordinatorId_idx" ON "goal_progress_updates"("coordinatorId");
CREATE INDEX "goal_progress_updates_status_idx" ON "goal_progress_updates"("status");
CREATE INDEX "goal_progress_updates_createdAt_idx" ON "goal_progress_updates"("createdAt");
CREATE INDEX "plan_review_reminders_participantId_idx" ON "plan_review_reminders"("participantId");
CREATE INDEX "plan_review_reminders_coordinatorId_idx" ON "plan_review_reminders"("coordinatorId");
CREATE INDEX "plan_review_reminders_reviewDate_idx" ON "plan_review_reminders"("reviewDate");
CREATE INDEX "plan_review_reminders_status_idx" ON "plan_review_reminders"("status");
CREATE INDEX "plan_manager_profiles_userId_idx" ON "plan_manager_profiles"("userId");
CREATE INDEX "plan_manager_profiles_organisationId_idx" ON "plan_manager_profiles"("organisationId");
CREATE INDEX "plan_manager_invoice_inbox_planManagerId_idx" ON "plan_manager_invoice_inbox"("planManagerId");
CREATE INDEX "plan_manager_invoice_inbox_participantId_idx" ON "plan_manager_invoice_inbox"("participantId");
CREATE INDEX "plan_manager_invoice_inbox_invoiceId_idx" ON "plan_manager_invoice_inbox"("invoiceId");
CREATE INDEX "plan_manager_invoice_inbox_status_idx" ON "plan_manager_invoice_inbox"("status");
CREATE INDEX "plan_manager_invoice_inbox_createdAt_idx" ON "plan_manager_invoice_inbox"("createdAt");
CREATE INDEX "invoice_review_events_invoiceId_idx" ON "invoice_review_events"("invoiceId");
CREATE INDEX "invoice_review_events_planManagerId_idx" ON "invoice_review_events"("planManagerId");
CREATE INDEX "invoice_review_events_createdAt_idx" ON "invoice_review_events"("createdAt");
CREATE INDEX "payment_processing_records_invoiceId_idx" ON "payment_processing_records"("invoiceId");
CREATE INDEX "payment_processing_records_planManagerId_idx" ON "payment_processing_records"("planManagerId");
CREATE INDEX "payment_processing_records_status_idx" ON "payment_processing_records"("status");
CREATE INDEX "plan_manager_notes_invoiceId_idx" ON "plan_manager_notes"("invoiceId");
CREATE INDEX "plan_manager_notes_planManagerId_idx" ON "plan_manager_notes"("planManagerId");
CREATE INDEX "plan_manager_notes_participantId_idx" ON "plan_manager_notes"("participantId");
CREATE INDEX "nominee_profiles_userId_idx" ON "nominee_profiles"("userId");
CREATE INDEX "participant_nominee_links_participantId_idx" ON "participant_nominee_links"("participantId");
CREATE INDEX "participant_nominee_links_nomineeId_idx" ON "participant_nominee_links"("nomineeId");
CREATE INDEX "participant_nominee_links_status_idx" ON "participant_nominee_links"("status");
CREATE INDEX "nominee_permissions_linkId_idx" ON "nominee_permissions"("linkId");
CREATE INDEX "nominee_action_logs_linkId_idx" ON "nominee_action_logs"("linkId");
CREATE INDEX "nominee_action_logs_nomineeId_idx" ON "nominee_action_logs"("nomineeId");
CREATE INDEX "nominee_action_logs_participantId_idx" ON "nominee_action_logs"("participantId");
CREATE INDEX "nominee_action_logs_createdAt_idx" ON "nominee_action_logs"("createdAt");
CREATE INDEX "family_notifications_userId_idx" ON "family_notifications"("userId");
CREATE INDEX "family_notifications_participantId_idx" ON "family_notifications"("participantId");
CREATE INDEX "family_notifications_createdAt_idx" ON "family_notifications"("createdAt");
CREATE INDEX "supported_decision_records_participantId_idx" ON "supported_decision_records"("participantId");
CREATE INDEX "supported_decision_records_supporterId_idx" ON "supported_decision_records"("supporterId");
CREATE INDEX "supported_decision_records_createdAt_idx" ON "supported_decision_records"("createdAt");
CREATE INDEX "home_modification_requests_participantId_idx" ON "home_modification_requests"("participantId");
CREATE INDEX "home_modification_requests_status_idx" ON "home_modification_requests"("status");
CREATE INDEX "home_modification_requests_createdAt_idx" ON "home_modification_requests"("createdAt");
CREATE INDEX "home_access_issues_requestId_idx" ON "home_access_issues"("requestId");
CREATE INDEX "home_modification_assessments_requestId_idx" ON "home_modification_assessments"("requestId");
CREATE INDEX "home_modification_assessments_assessorId_idx" ON "home_modification_assessments"("assessorId");
CREATE INDEX "home_modification_assessments_bookingId_idx" ON "home_modification_assessments"("bookingId");
CREATE INDEX "home_modification_quotes_requestId_idx" ON "home_modification_quotes"("requestId");
CREATE INDEX "home_modification_quotes_providerId_idx" ON "home_modification_quotes"("providerId");
CREATE INDEX "home_modification_quotes_status_idx" ON "home_modification_quotes"("status");
CREATE INDEX "home_modification_projects_requestId_idx" ON "home_modification_projects"("requestId");
CREATE INDEX "home_modification_projects_participantId_idx" ON "home_modification_projects"("participantId");
CREATE INDEX "home_modification_projects_providerId_idx" ON "home_modification_projects"("providerId");
CREATE INDEX "home_modification_projects_status_idx" ON "home_modification_projects"("status");
CREATE INDEX "home_modification_projects_invoiceId_idx" ON "home_modification_projects"("invoiceId");
CREATE INDEX "project_milestones_projectId_idx" ON "project_milestones"("projectId");
CREATE INDEX "project_milestones_status_idx" ON "project_milestones"("status");
CREATE INDEX "home_modification_documents_requestId_idx" ON "home_modification_documents"("requestId");
CREATE INDEX "home_modification_documents_participantId_idx" ON "home_modification_documents"("participantId");
CREATE INDEX "home_modification_documents_uploadedById_idx" ON "home_modification_documents"("uploadedById");
CREATE INDEX "home_modification_provider_profiles_organisationId_idx" ON "home_modification_provider_profiles"("organisationId");
CREATE INDEX "home_modification_provider_profiles_verificationStatus_idx" ON "home_modification_provider_profiles"("verificationStatus");

-- RLS placeholders (enable when using Supabase/Postgres RLS policies)
-- ALTER TABLE "data_access_logs" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "support_coordination_referrals" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "plan_manager_invoice_inbox" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "participant_nominee_links" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "home_modification_requests" ENABLE ROW LEVEL SECURITY;
