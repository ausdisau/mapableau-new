-- RightsOS foundation: purpose registry, shadow firewall, ledger, vault, decision room, capsules, duties

-- CreateEnum
CREATE TYPE "RightsDataOperation" AS ENUM ('read', 'disclose', 'create_derived_data', 'store', 'update', 'export', 'contact');
CREATE TYPE "RightsPolicyOutcome" AS ENUM ('allow', 'allow_with_duties', 'deny', 'participant_review_required', 'human_review_required');
CREATE TYPE "RightsRequestType" AS ENUM ('access', 'correction', 'deletion', 'export', 'revocation', 'restriction', 'objection', 'explanation', 'recipient_disclosure_history', 'complaint');
CREATE TYPE "RightsRequestStatus" AS ENUM ('draft', 'identity_check', 'scope_confirmation', 'participant_review', 'submitted', 'acknowledged', 'processing', 'partially_completed', 'completed', 'denied_with_reason', 'human_review', 'appealed', 'closed');
CREATE TYPE "AccessCapsuleStatus" AS ENUM ('draft', 'disclosure_compiled', 'participant_review', 'approved', 'issued', 'presented', 'verified', 'used', 'expired', 'revoked', 'deleted_or_archived');
CREATE TYPE "DecisionRoomStatus" AS ENUM ('draft', 'open', 'paused', 'decided', 'revised', 'revoked');
CREATE TYPE "RecipientDutyReceiptType" AS ENUM ('system_verified', 'recipient_attestation', 'participant_report', 'external_verification', 'unverifiable');
CREATE TYPE "VaultDeviceStatus" AS ENUM ('active', 'revoked', 'lost');
CREATE TYPE "RightsCapabilityLeaseStatus" AS ENUM ('active', 'expired', 'revoked', 'consumed');

-- CreateTable
CREATE TABLE "rights_purposes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "policyOwner" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rights_purposes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rights_purpose_versions" (
    "id" TEXT NOT NULL,
    "purposeId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "definitionJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rights_purpose_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rights_field_definitions" (
    "id" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "sensitivity" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "description" TEXT,
    "definitionJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rights_field_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rights_data_use_requests" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "requesterActorId" TEXT NOT NULL,
    "requesterActorType" TEXT NOT NULL,
    "requesterOrganisationId" TEXT,
    "requesterRole" TEXT,
    "recipientDisplayName" TEXT NOT NULL,
    "recipientActorId" TEXT,
    "recipientOrganisationId" TEXT,
    "recipientServiceId" TEXT,
    "purposeCode" TEXT NOT NULL,
    "requestedOperations" "RightsDataOperation"[],
    "requestedFields" TEXT[],
    "sourceAssets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contextJson" JSONB NOT NULL DEFAULT '{}',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedUntil" TIMESTAMP(3),
    "onwardSharingRequested" BOOLEAN NOT NULL DEFAULT false,
    "retentionRequested" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rights_data_use_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rights_policy_decisions" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "outcome" "RightsPolicyOutcome" NOT NULL,
    "allowedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deniedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedOperations" "RightsDataOperation"[] DEFAULT ARRAY[]::TEXT[],
    "deniedOperations" "RightsDataOperation"[] DEFAULT ARRAY[]::TEXT[],
    "dutiesJson" JSONB NOT NULL DEFAULT '[]',
    "prohibitionsJson" JSONB NOT NULL DEFAULT '[]',
    "requiredApprovals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredAuthorityRecords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reasonsJson" JSONB NOT NULL DEFAULT '[]',
    "policyVersion" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rights_policy_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rights_capability_leases" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "policyDecisionId" TEXT NOT NULL,
    "vaultItemId" TEXT,
    "requesterActorId" TEXT NOT NULL,
    "recipientOrganisationId" TEXT,
    "recipientServiceId" TEXT,
    "purposeCode" TEXT NOT NULL,
    "permittedFields" TEXT[],
    "permittedOperations" "RightsDataOperation"[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "useLimit" INTEGER NOT NULL DEFAULT 1,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "participantApprovalRef" TEXT,
    "status" "RightsCapabilityLeaseStatus" NOT NULL DEFAULT 'active',
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rights_capability_leases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rights_ledger_manifests" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "manifestJson" JSONB NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correlationId" TEXT,
    CONSTRAINT "rights_ledger_manifests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rights_requests" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "requestType" "RightsRequestType" NOT NULL,
    "status" "RightsRequestStatus" NOT NULL DEFAULT 'draft',
    "scopeJson" JSONB NOT NULL DEFAULT '{}',
    "limitationNote" TEXT,
    "assignedOfficerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rights_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rights_request_events" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rights_request_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rights_policy_conflicts" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "affectedPolicies" JSONB NOT NULL,
    "participantImpact" TEXT NOT NULL,
    "safeDefault" TEXT NOT NULL,
    "reviewOwner" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rights_policy_conflicts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "personal_vaults" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "encryptionState" TEXT NOT NULL DEFAULT 'kms_envelope',
    "recoveryMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "personal_vaults_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "personal_vault_items" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sensitivity" TEXT NOT NULL,
    "fieldsJson" JSONB NOT NULL DEFAULT '[]',
    "encryptionState" TEXT NOT NULL DEFAULT 'encrypted',
    "permittedModules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "permittedPurposes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultPolicyJson" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "provenanceJson" JSONB NOT NULL DEFAULT '{}',
    "exportState" TEXT,
    "deletionState" TEXT,
    "encryptedPayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "personal_vault_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vault_devices" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "deviceLabel" TEXT NOT NULL,
    "status" "VaultDeviceStatus" NOT NULL DEFAULT 'active',
    "keyReference" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "vault_devices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vault_exports" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "manifestJson" JSONB NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vault_exports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_rooms" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" "DecisionRoomStatus" NOT NULL DEFAULT 'draft',
    "valuesJson" JSONB NOT NULL DEFAULT '[]',
    "constraintsJson" JSONB NOT NULL DEFAULT '[]',
    "reviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "decision_rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_options" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "decision_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_evidence_references" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "decision_evidence_references_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_supporters" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "supporterUserId" TEXT NOT NULL,
    "authorityScope" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "decision_supporters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_supporter_contributions" (
    "id" TEXT NOT NULL,
    "supporterId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "decision_supporter_contributions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_dissents" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "supporterId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "decision_dissents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_records" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "participantWording" TEXT NOT NULL,
    "chosenOptionId" TEXT,
    "reflection" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "decision_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_attestations" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "attestationType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "decision_attestations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "access_capsules" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "leaseId" TEXT,
    "purposeCode" TEXT NOT NULL,
    "status" "AccessCapsuleStatus" NOT NULL DEFAULT 'draft',
    "disclosedClaimsJson" JSONB NOT NULL DEFAULT '[]',
    "omittedSummaryJson" JSONB NOT NULL DEFAULT '[]',
    "holderDisplayName" TEXT,
    "verifierOrganisationId" TEXT,
    "presentationMethod" TEXT NOT NULL DEFAULT 'secure_link',
    "secureTokenHash" TEXT,
    "useLimit" INTEGER NOT NULL DEFAULT 1,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "access_capsules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "capsule_verifications" (
    "id" TEXT NOT NULL,
    "capsuleId" TEXT NOT NULL,
    "verifierActorId" TEXT,
    "verifierOrgId" TEXT,
    "outcome" TEXT NOT NULL,
    "challengePassed" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "capsule_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recipient_obligations" (
    "id" TEXT NOT NULL,
    "capsuleId" TEXT,
    "organisationId" TEXT,
    "purposeCode" TEXT NOT NULL,
    "dutiesJson" JSONB NOT NULL DEFAULT '[]',
    "prohibitionsJson" JSONB NOT NULL DEFAULT '[]',
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recipient_obligations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recipient_duty_receipts" (
    "id" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "dutyCode" TEXT NOT NULL,
    "receiptType" "RecipientDutyReceiptType" NOT NULL,
    "attestationNote" TEXT,
    "actorUserId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recipient_duty_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rights_purposes_code_key" ON "rights_purposes"("code");
CREATE UNIQUE INDEX "rights_purpose_versions_purposeId_version_key" ON "rights_purpose_versions"("purposeId", "version");
CREATE UNIQUE INDEX "rights_field_definitions_fieldPath_key" ON "rights_field_definitions"("fieldPath");
CREATE UNIQUE INDEX "rights_data_use_requests_requestId_key" ON "rights_data_use_requests"("requestId");
CREATE INDEX "rights_data_use_requests_subjectUserId_idx" ON "rights_data_use_requests"("subjectUserId");
CREATE INDEX "rights_data_use_requests_purposeCode_idx" ON "rights_data_use_requests"("purposeCode");
CREATE UNIQUE INDEX "rights_policy_decisions_decisionId_key" ON "rights_policy_decisions"("decisionId");
CREATE INDEX "rights_policy_decisions_subjectUserId_idx" ON "rights_policy_decisions"("subjectUserId");
CREATE INDEX "rights_policy_decisions_requestId_idx" ON "rights_policy_decisions"("requestId");
CREATE INDEX "rights_capability_leases_subjectUserId_status_idx" ON "rights_capability_leases"("subjectUserId", "status");
CREATE INDEX "rights_capability_leases_expiresAt_idx" ON "rights_capability_leases"("expiresAt");
CREATE INDEX "rights_ledger_manifests_subjectUserId_idx" ON "rights_ledger_manifests"("subjectUserId");
CREATE INDEX "rights_requests_subjectUserId_status_idx" ON "rights_requests"("subjectUserId", "status");
CREATE INDEX "rights_request_events_requestId_idx" ON "rights_request_events"("requestId");
CREATE INDEX "rights_policy_conflicts_subjectUserId_status_idx" ON "rights_policy_conflicts"("subjectUserId", "status");
CREATE UNIQUE INDEX "personal_vaults_subjectUserId_key" ON "personal_vaults"("subjectUserId");
CREATE INDEX "personal_vault_items_vaultId_category_idx" ON "personal_vault_items"("vaultId", "category");
CREATE INDEX "vault_devices_subjectUserId_idx" ON "vault_devices"("subjectUserId");
CREATE INDEX "vault_exports_vaultId_idx" ON "vault_exports"("vaultId");
CREATE INDEX "decision_rooms_subjectUserId_status_idx" ON "decision_rooms"("subjectUserId", "status");
CREATE INDEX "decision_options_roomId_idx" ON "decision_options"("roomId");
CREATE INDEX "decision_evidence_references_roomId_idx" ON "decision_evidence_references"("roomId");
CREATE UNIQUE INDEX "decision_supporters_roomId_supporterUserId_key" ON "decision_supporters"("roomId", "supporterUserId");
CREATE INDEX "decision_supporter_contributions_supporterId_idx" ON "decision_supporter_contributions"("supporterId");
CREATE INDEX "decision_dissents_roomId_idx" ON "decision_dissents"("roomId");
CREATE INDEX "decision_records_roomId_idx" ON "decision_records"("roomId");
CREATE INDEX "decision_attestations_recordId_idx" ON "decision_attestations"("recordId");
CREATE INDEX "access_capsules_subjectUserId_status_idx" ON "access_capsules"("subjectUserId", "status");
CREATE INDEX "access_capsules_secureTokenHash_idx" ON "access_capsules"("secureTokenHash");
CREATE INDEX "capsule_verifications_capsuleId_idx" ON "capsule_verifications"("capsuleId");
CREATE INDEX "recipient_obligations_organisationId_status_idx" ON "recipient_obligations"("organisationId", "status");
CREATE INDEX "recipient_duty_receipts_obligationId_idx" ON "recipient_duty_receipts"("obligationId");
CREATE INDEX "rights_field_definitions_domain_idx" ON "rights_field_definitions"("domain");

-- AddForeignKey
ALTER TABLE "rights_purpose_versions" ADD CONSTRAINT "rights_purpose_versions_purposeId_fkey" FOREIGN KEY ("purposeId") REFERENCES "rights_purposes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rights_data_use_requests" ADD CONSTRAINT "rights_data_use_requests_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rights_data_use_requests" ADD CONSTRAINT "rights_data_use_requests_requesterActorId_fkey" FOREIGN KEY ("requesterActorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rights_policy_decisions" ADD CONSTRAINT "rights_policy_decisions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "rights_data_use_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rights_policy_decisions" ADD CONSTRAINT "rights_policy_decisions_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rights_capability_leases" ADD CONSTRAINT "rights_capability_leases_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rights_capability_leases" ADD CONSTRAINT "rights_capability_leases_policyDecisionId_fkey" FOREIGN KEY ("policyDecisionId") REFERENCES "rights_policy_decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rights_requests" ADD CONSTRAINT "rights_requests_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rights_request_events" ADD CONSTRAINT "rights_request_events_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "rights_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_vaults" ADD CONSTRAINT "personal_vaults_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_vault_items" ADD CONSTRAINT "personal_vault_items_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_devices" ADD CONSTRAINT "vault_devices_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_devices" ADD CONSTRAINT "vault_devices_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_exports" ADD CONSTRAINT "vault_exports_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decision_rooms" ADD CONSTRAINT "decision_rooms_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decision_options" ADD CONSTRAINT "decision_options_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decision_evidence_references" ADD CONSTRAINT "decision_evidence_references_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decision_supporters" ADD CONSTRAINT "decision_supporters_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decision_supporters" ADD CONSTRAINT "decision_supporters_supporterUserId_fkey" FOREIGN KEY ("supporterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "decision_supporter_contributions" ADD CONSTRAINT "decision_supporter_contributions_supporterId_fkey" FOREIGN KEY ("supporterId") REFERENCES "decision_supporters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decision_dissents" ADD CONSTRAINT "decision_dissents_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decision_dissents" ADD CONSTRAINT "decision_dissents_supporterId_fkey" FOREIGN KEY ("supporterId") REFERENCES "decision_supporters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decision_records" ADD CONSTRAINT "decision_records_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decision_attestations" ADD CONSTRAINT "decision_attestations_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "decision_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_capsules" ADD CONSTRAINT "access_capsules_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_capsules" ADD CONSTRAINT "access_capsules_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "rights_capability_leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "capsule_verifications" ADD CONSTRAINT "capsule_verifications_capsuleId_fkey" FOREIGN KEY ("capsuleId") REFERENCES "access_capsules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recipient_obligations" ADD CONSTRAINT "recipient_obligations_capsuleId_fkey" FOREIGN KEY ("capsuleId") REFERENCES "access_capsules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recipient_duty_receipts" ADD CONSTRAINT "recipient_duty_receipts_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "recipient_obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
