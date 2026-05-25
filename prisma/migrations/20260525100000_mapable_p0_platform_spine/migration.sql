-- MapAble Priority 0 platform spine

CREATE TYPE "ProfileRoleStatus" AS ENUM ('pending', 'active', 'suspended', 'revoked');
CREATE TYPE "PlatformConsentScope" AS ENUM (
  'view_profile', 'view_bookings', 'view_documents', 'view_invoices', 'view_messages',
  'view_service_logs', 'view_outcomes', 'approve_invoices', 'manage_bookings', 'emergency_access'
);
CREATE TYPE "ConsentEventType" AS ENUM ('granted', 'revoked', 'expired', 'scope_changed', 'emergency_used');
CREATE TYPE "DataAccessAction" AS ENUM ('read', 'export', 'search', 'list');
CREATE TYPE "FeatureFlagRuleOperator" AS ENUM ('equals', 'in', 'not_in');

ALTER TABLE "UserRoleAssignment" RENAME TO "profile_roles";
ALTER TABLE "profile_roles" ADD COLUMN "status" "ProfileRoleStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "profile_roles" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "profile_roles" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "profile_roles" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "profile_roles_userId_status_idx" ON "profile_roles"("userId", "status");
CREATE INDEX "profile_roles_role_status_idx" ON "profile_roles"("role", "status");

ALTER TABLE "ConsentRecord" RENAME TO "consent_grants";
ALTER TABLE "AuditEvent" RENAME TO "audit_logs";

CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "MapAbleUserRole" NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "role_permissions_role_permission_key" ON "role_permissions"("role", "permission");
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

CREATE TABLE "consent_events" (
    "id" TEXT NOT NULL,
    "consentRecordId" TEXT NOT NULL,
    "eventType" "ConsentEventType" NOT NULL,
    "actorUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consent_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "consent_events_consentRecordId_createdAt_idx" ON "consent_events"("consentRecordId", "createdAt");
ALTER TABLE "consent_events" ADD CONSTRAINT "consent_events_consentRecordId_fkey" FOREIGN KEY ("consentRecordId") REFERENCES "consent_grants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "data_access_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" "MapAbleUserRole",
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "participantId" TEXT,
    "organisationId" TEXT,
    "action" "DataAccessAction" NOT NULL DEFAULT 'read',
    "consentScope" "PlatformConsentScope",
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "data_access_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "data_access_logs_actorUserId_createdAt_idx" ON "data_access_logs"("actorUserId", "createdAt");
CREATE INDEX "data_access_logs_participantId_createdAt_idx" ON "data_access_logs"("participantId", "createdAt");
CREATE INDEX "data_access_logs_organisationId_createdAt_idx" ON "data_access_logs"("organisationId", "createdAt");
CREATE INDEX "data_access_logs_resourceType_createdAt_idx" ON "data_access_logs"("resourceType", "createdAt");

CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

CREATE TABLE "feature_flag_rules" (
    "id" TEXT NOT NULL,
    "featureFlagId" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "operator" "FeatureFlagRuleOperator" NOT NULL DEFAULT 'equals',
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feature_flag_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "feature_flag_rules_featureFlagId_idx" ON "feature_flag_rules"("featureFlagId");
ALTER TABLE "feature_flag_rules" ADD CONSTRAINT "feature_flag_rules_featureFlagId_fkey" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "feature_flag_events" (
    "id" TEXT NOT NULL,
    "featureFlagId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "evaluated" BOOLEAN NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feature_flag_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "feature_flag_events_featureFlagId_createdAt_idx" ON "feature_flag_events"("featureFlagId", "createdAt");
ALTER TABLE "feature_flag_events" ADD CONSTRAINT "feature_flag_events_featureFlagId_fkey" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS placeholders (enable when using Supabase Auth + RLS)
-- ALTER TABLE "profile_roles" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "consent_grants" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "data_access_logs" ENABLE ROW LEVEL SECURITY;
