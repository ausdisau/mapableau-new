-- Quality & Safeguards Ops Centre — Wave 1 foundation

CREATE TYPE "SafeguardSignalSourceType" AS ENUM (
  'participant_report',
  'worker_report',
  'complaint',
  'incident',
  'care_shift',
  'transport_trip',
  'job_service',
  'credential',
  'training',
  'service_note',
  'system_rule',
  'external_referral',
  'anonymous',
  'trust_safety_queue'
);

CREATE TYPE "SafeguardSignalUrgency" AS ENUM (
  'critical',
  'high',
  'moderate',
  'low',
  'unassessed'
);

CREATE TYPE "SafeguardSignalStatus" AS ENUM (
  'new',
  'triaged',
  'linked',
  'converted_to_case',
  'dismissed_with_reason'
);

CREATE TYPE "SafeguardServiceVertical" AS ENUM (
  'care',
  'transport',
  'jobs',
  'core',
  'other'
);

CREATE TYPE "QsDeadlineInstanceStatus" AS ENUM (
  'pending',
  'due_soon',
  'overdue',
  'completed',
  'cancelled',
  'escalated'
);

CREATE TYPE "QsWorkflowTaskStatus" AS ENUM (
  'open',
  'in_progress',
  'blocked',
  'done',
  'cancelled'
);

CREATE TYPE "QsCapabilityCode" AS ENUM (
  'qs_ops_read',
  'qs_signal_triage',
  'incident_triage',
  'incident_confirm_reportability',
  'incident_close',
  'complaint_investigate',
  'complaint_resolve',
  'complaint_view_identity',
  'evidence_add',
  'evidence_export',
  'credential_verify',
  'worker_restrict_assignment',
  'capa_approve',
  'audit_manage',
  'audit_view',
  'policy_publish',
  'restrictive_practice_view',
  'restrictive_practice_manage',
  'analytics_view_identified',
  'analytics_view_deidentified'
);

CREATE TABLE "safeguard_signals" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "sourceType" "SafeguardSignalSourceType" NOT NULL,
  "sourceId" TEXT,
  "participantId" TEXT,
  "workerId" TEXT,
  "providerId" TEXT,
  "serviceVertical" "SafeguardServiceVertical" NOT NULL DEFAULT 'core',
  "summary" TEXT NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "urgency" "SafeguardSignalUrgency" NOT NULL DEFAULT 'unassessed',
  "immediateSafetyConcern" BOOLEAN NOT NULL DEFAULT false,
  "assignedTeam" TEXT,
  "assignedUserId" TEXT,
  "status" "SafeguardSignalStatus" NOT NULL DEFAULT 'new',
  "ruleTriggers" JSONB NOT NULL DEFAULT '[]',
  "createdById" TEXT,
  "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  "dismissReason" TEXT,
  "triageNotes" TEXT,
  "convertedResourceType" TEXT,
  "convertedResourceId" TEXT,
  "deletedAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "safeguard_signals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "safeguard_signals_organisationId_status_idx" ON "safeguard_signals"("organisationId", "status");
CREATE INDEX "safeguard_signals_urgency_status_idx" ON "safeguard_signals"("urgency", "status");
CREATE INDEX "safeguard_signals_sourceType_sourceId_idx" ON "safeguard_signals"("sourceType", "sourceId");
CREATE INDEX "safeguard_signals_participantId_idx" ON "safeguard_signals"("participantId");
CREATE INDEX "safeguard_signals_immediateSafetyConcern_status_idx" ON "safeguard_signals"("immediateSafetyConcern", "status");

ALTER TABLE "safeguard_signals" ADD CONSTRAINT "safeguard_signals_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "safeguard_signals" ADD CONSTRAINT "safeguard_signals_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "safeguard_signals" ADD CONSTRAINT "safeguard_signals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "safeguard_signal_links" (
  "id" TEXT NOT NULL,
  "fromSignalId" TEXT NOT NULL,
  "toSignalId" TEXT NOT NULL,
  "linkType" TEXT NOT NULL DEFAULT 'related',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "safeguard_signal_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "safeguard_signal_links_fromSignalId_toSignalId_linkType_key" ON "safeguard_signal_links"("fromSignalId", "toSignalId", "linkType");
CREATE INDEX "safeguard_signal_links_toSignalId_idx" ON "safeguard_signal_links"("toSignalId");

ALTER TABLE "safeguard_signal_links" ADD CONSTRAINT "safeguard_signal_links_fromSignalId_fkey" FOREIGN KEY ("fromSignalId") REFERENCES "safeguard_signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safeguard_signal_links" ADD CONSTRAINT "safeguard_signal_links_toSignalId_fkey" FOREIGN KEY ("toSignalId") REFERENCES "safeguard_signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "qs_capability_grants" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organisationId" TEXT,
  "capability" "QsCapabilityCode" NOT NULL,
  "grantedById" TEXT,
  "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activeTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "qs_capability_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "qs_capability_grants_userId_organisationId_capability_key" ON "qs_capability_grants"("userId", "organisationId", "capability");
CREATE INDEX "qs_capability_grants_userId_capability_idx" ON "qs_capability_grants"("userId", "capability");
CREATE INDEX "qs_capability_grants_organisationId_idx" ON "qs_capability_grants"("organisationId");

ALTER TABLE "qs_capability_grants" ADD CONSTRAINT "qs_capability_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qs_capability_grants" ADD CONSTRAINT "qs_capability_grants_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qs_capability_grants" ADD CONSTRAINT "qs_capability_grants_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "qs_deadline_rules" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "triggerEvent" TEXT NOT NULL,
  "conditionsJson" JSONB NOT NULL DEFAULT '[]',
  "durationKind" TEXT NOT NULL,
  "durationValue" INTEGER NOT NULL,
  "jurisdiction" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "escalationPath" JSONB NOT NULL DEFAULT '[]',
  "sourceReference" TEXT,
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveTo" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "qs_deadline_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "qs_deadline_rules_code_version_key" ON "qs_deadline_rules"("code", "version");
CREATE INDEX "qs_deadline_rules_triggerEvent_active_idx" ON "qs_deadline_rules"("triggerEvent", "active");

CREATE TABLE "qs_deadline_instances" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "ruleId" TEXT,
  "ruleCode" TEXT NOT NULL,
  "ruleVersion" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "triggerEvent" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
  "dueAt" TIMESTAMP(3) NOT NULL,
  "status" "QsDeadlineInstanceStatus" NOT NULL DEFAULT 'pending',
  "escalatedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "correlationId" TEXT,
  "metadataJson" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "qs_deadline_instances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "qs_deadline_instances_organisationId_status_dueAt_idx" ON "qs_deadline_instances"("organisationId", "status", "dueAt");
CREATE INDEX "qs_deadline_instances_resourceType_resourceId_idx" ON "qs_deadline_instances"("resourceType", "resourceId");
CREATE INDEX "qs_deadline_instances_dueAt_status_idx" ON "qs_deadline_instances"("dueAt", "status");

ALTER TABLE "qs_deadline_instances" ADD CONSTRAINT "qs_deadline_instances_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qs_deadline_instances" ADD CONSTRAINT "qs_deadline_instances_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "qs_deadline_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "qs_workflow_tasks" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "status" "QsWorkflowTaskStatus" NOT NULL DEFAULT 'open',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "assigneeId" TEXT,
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "qs_workflow_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "qs_workflow_tasks_organisationId_status_idx" ON "qs_workflow_tasks"("organisationId", "status");
CREATE INDEX "qs_workflow_tasks_assigneeId_status_idx" ON "qs_workflow_tasks"("assigneeId", "status");
CREATE INDEX "qs_workflow_tasks_resourceType_resourceId_idx" ON "qs_workflow_tasks"("resourceType", "resourceId");

ALTER TABLE "qs_workflow_tasks" ADD CONSTRAINT "qs_workflow_tasks_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qs_workflow_tasks" ADD CONSTRAINT "qs_workflow_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "qs_immutable_audit_events" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "actorId" TEXT,
  "actorRole" TEXT,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "reason" TEXT,
  "beforeHash" TEXT,
  "afterHash" TEXT,
  "eventHash" TEXT NOT NULL,
  "previousHash" TEXT,
  "correlationId" TEXT NOT NULL,
  "metadataJson" JSONB NOT NULL DEFAULT '{}',

  CONSTRAINT "qs_immutable_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "qs_immutable_audit_events_organisationId_occurredAt_idx" ON "qs_immutable_audit_events"("organisationId", "occurredAt");
CREATE INDEX "qs_immutable_audit_events_resourceType_resourceId_idx" ON "qs_immutable_audit_events"("resourceType", "resourceId");
CREATE INDEX "qs_immutable_audit_events_correlationId_idx" ON "qs_immutable_audit_events"("correlationId");
CREATE INDEX "qs_immutable_audit_events_eventHash_idx" ON "qs_immutable_audit_events"("eventHash");

ALTER TABLE "qs_immutable_audit_events" ADD CONSTRAINT "qs_immutable_audit_events_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qs_immutable_audit_events" ADD CONSTRAINT "qs_immutable_audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "qs_regulatory_profile_configs" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "code" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "jurisdiction" TEXT NOT NULL DEFAULT 'AU',
  "profileJson" JSONB NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveTo" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "qs_regulatory_profile_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "qs_regulatory_profile_configs_code_version_organisationId_key" ON "qs_regulatory_profile_configs"("code", "version", "organisationId");
CREATE INDEX "qs_regulatory_profile_configs_active_effectiveFrom_idx" ON "qs_regulatory_profile_configs"("active", "effectiveFrom");

ALTER TABLE "qs_regulatory_profile_configs" ADD CONSTRAINT "qs_regulatory_profile_configs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
