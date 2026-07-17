-- Personal Access Vault (additive)
-- Hybrid Capability Vault: reference-first registry + later-wave tables (all feature-flagged)

CREATE TYPE "VaultDeviceStatus" AS ENUM ('active', 'revoked', 'lost', 'pending');

-- CreateEnum
CREATE TYPE "VaultCapabilityStatus" AS ENUM ('draft', 'active', 'revoked', 'expired', 'shadow');

-- CreateEnum
CREATE TYPE "VaultRecoveryStatus" AS ENUM ('draft', 'pending', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "VaultImportStatus" AS ENUM ('received', 'malware_scan', 'integrity_check', 'schema_check', 'provenance_review', 'duplicate_detection', 'canonical_routing', 'participant_review', 'imported', 'quarantined', 'rejected');

-- CreateEnum
CREATE TYPE "VaultDeletionReceiptKind" AS ENUM ('system_confirmed', 'local_confirmed', 'key_destroyed', 'recipient_attested', 'external_requested', 'backup_pending', 'denied', 'limited_by_retention');

-- CreateTable

CREATE TABLE "personal_vaults" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'shadow',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_vaults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_items" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "canonicalDomain" TEXT NOT NULL,
    "canonicalRecordId" TEXT,
    "canonicalVersion" TEXT,
    "vaultTreatment" TEXT NOT NULL DEFAULT 'reference_only',
    "classification" TEXT NOT NULL,
    "fieldManifestJson" JSONB NOT NULL DEFAULT '[]',
    "purpose" TEXT NOT NULL DEFAULT 'participant_visibility',
    "provenanceJson" JSONB NOT NULL DEFAULT '{}',
    "retentionReason" TEXT,
    "encryptionState" TEXT NOT NULL DEFAULT 'none_reference_only',
    "exportState" TEXT,
    "deletionState" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_encrypted_envelopes" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "itemId" TEXT,
    "encryptedPayloadReference" TEXT,
    "algorithm" TEXT NOT NULL DEFAULT 'aes-256-gcm',
    "keyReference" TEXT,
    "keyVersion" TEXT NOT NULL DEFAULT '1',
    "encryptedDataKey" TEXT,
    "payloadHash" TEXT,
    "metadataHash" TEXT,
    "policyReference" TEXT,
    "provenanceReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vault_encrypted_envelopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_devices" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "deviceLabel" TEXT NOT NULL,
    "platform" TEXT,
    "devicePublicKey" TEXT,
    "attestationState" TEXT,
    "passkeyCredentialId" TEXT,
    "localVaultEligible" BOOLEAN NOT NULL DEFAULT false,
    "offlineKeyVersion" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'never_synced',
    "riskState" TEXT NOT NULL DEFAULT 'unknown',
    "status" "VaultDeviceStatus" NOT NULL DEFAULT 'pending',
    "lastUsedAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "remoteWipeRequestedAt" TIMESTAMP(3),

    CONSTRAINT "vault_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_device_capabilities" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "scopeJson" JSONB NOT NULL DEFAULT '[]',
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_device_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_capabilities" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "itemId" TEXT,
    "holderUserId" TEXT NOT NULL,
    "issuer" TEXT NOT NULL DEFAULT 'mapable_vault',
    "purposeCode" TEXT NOT NULL,
    "recipientOrganisationId" TEXT,
    "recipientServiceId" TEXT,
    "fieldSet" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedOperations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contextJson" JSONB NOT NULL DEFAULT '{}',
    "useLimit" INTEGER NOT NULL DEFAULT 1,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "delegationRule" TEXT NOT NULL DEFAULT 'non_transferable',
    "onwardSharingRule" TEXT NOT NULL DEFAULT 'prohibited',
    "status" "VaultCapabilityStatus" NOT NULL DEFAULT 'shadow',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "auditCorrelationId" TEXT,
    "rightsLeaseReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_capability_uses" (
    "id" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "outcome" TEXT NOT NULL,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_capability_uses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_disclosure_views" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "itemId" TEXT,
    "purposeCode" TEXT NOT NULL,
    "recipientLabel" TEXT,
    "recipientOrganisationId" TEXT,
    "permittedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deniedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reasonsJson" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'compiled',
    "mode" TEXT NOT NULL DEFAULT 'shadow',
    "expiresAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_disclosure_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_disclosure_receipts" (
    "id" TEXT NOT NULL,
    "disclosureId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_disclosure_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_trusted_contacts" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "relationship" TEXT,
    "contactMethod" TEXT,
    "purposesJson" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "vault_trusted_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_recovery_configurations" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "thresholdJson" JSONB NOT NULL DEFAULT '{}',
    "accessibleNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_recovery_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_recovery_requests" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "status" "VaultRecoveryStatus" NOT NULL DEFAULT 'draft',
    "evidenceJson" JSONB NOT NULL DEFAULT '{}',
    "restoredScopeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "vault_recovery_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_recovery_participants" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "participatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_recovery_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_recovery_receipts" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_recovery_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_sync_operations" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "deviceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'started',
    "summaryJson" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "vault_sync_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_sync_conflicts" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "detailsJson" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_exports" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'mapable_portable_vault_package',
    "status" TEXT NOT NULL DEFAULT 'created',
    "manifestJson" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMP(3),
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_export_items" (
    "id" TEXT NOT NULL,
    "exportId" TEXT NOT NULL,
    "itemId" TEXT,
    "itemType" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vault_export_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_imports" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "status" "VaultImportStatus" NOT NULL DEFAULT 'received',
    "sourceLabel" TEXT,
    "manifestJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_import_findings" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_import_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_deletion_requests" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "itemId" TEXT,
    "scopeJson" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'requested',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "vault_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_deletion_receipts" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "kind" "VaultDeletionReceiptKind" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_deletion_receipts_pkey" PRIMARY KEY ("id")

CREATE UNIQUE INDEX "personal_vaults_ownerUserId_key" ON "personal_vaults"("ownerUserId");

-- CreateIndex
CREATE INDEX "vault_items_vaultId_category_idx" ON "vault_items"("vaultId", "category");

-- CreateIndex
CREATE INDEX "vault_items_vaultId_itemType_idx" ON "vault_items"("vaultId", "itemType");

-- CreateIndex
CREATE INDEX "vault_items_canonicalDomain_canonicalRecordId_idx" ON "vault_items"("canonicalDomain", "canonicalRecordId");

-- CreateIndex
CREATE INDEX "vault_encrypted_envelopes_vaultId_idx" ON "vault_encrypted_envelopes"("vaultId");

-- CreateIndex
CREATE INDEX "vault_encrypted_envelopes_itemId_idx" ON "vault_encrypted_envelopes"("itemId");

-- CreateIndex
CREATE INDEX "vault_devices_ownerUserId_status_idx" ON "vault_devices"("ownerUserId", "status");

-- CreateIndex
CREATE INDEX "vault_devices_vaultId_status_idx" ON "vault_devices"("vaultId", "status");

-- CreateIndex
CREATE INDEX "vault_device_capabilities_deviceId_idx" ON "vault_device_capabilities"("deviceId");

-- CreateIndex
CREATE INDEX "vault_capabilities_vaultId_status_idx" ON "vault_capabilities"("vaultId", "status");

-- CreateIndex
CREATE INDEX "vault_capabilities_holderUserId_expiresAt_idx" ON "vault_capabilities"("holderUserId", "expiresAt");

-- CreateIndex
CREATE INDEX "vault_capabilities_purposeCode_idx" ON "vault_capabilities"("purposeCode");

-- CreateIndex
CREATE INDEX "vault_capability_uses_capabilityId_idx" ON "vault_capability_uses"("capabilityId");

-- CreateIndex
CREATE INDEX "vault_disclosure_views_vaultId_purposeCode_idx" ON "vault_disclosure_views"("vaultId", "purposeCode");

-- CreateIndex
CREATE INDEX "vault_disclosure_receipts_disclosureId_idx" ON "vault_disclosure_receipts"("disclosureId");

-- CreateIndex
CREATE INDEX "vault_trusted_contacts_vaultId_status_idx" ON "vault_trusted_contacts"("vaultId", "status");

-- CreateIndex
CREATE INDEX "vault_recovery_configurations_vaultId_idx" ON "vault_recovery_configurations"("vaultId");

-- CreateIndex
CREATE INDEX "vault_recovery_requests_vaultId_status_idx" ON "vault_recovery_requests"("vaultId", "status");

-- CreateIndex
CREATE INDEX "vault_recovery_participants_requestId_idx" ON "vault_recovery_participants"("requestId");

-- CreateIndex
CREATE INDEX "vault_recovery_receipts_requestId_idx" ON "vault_recovery_receipts"("requestId");

-- CreateIndex
CREATE INDEX "vault_sync_operations_vaultId_status_idx" ON "vault_sync_operations"("vaultId", "status");

-- CreateIndex
CREATE INDEX "vault_sync_conflicts_operationId_status_idx" ON "vault_sync_conflicts"("operationId", "status");

-- CreateIndex
CREATE INDEX "vault_exports_vaultId_idx" ON "vault_exports"("vaultId");

-- CreateIndex
CREATE INDEX "vault_export_items_exportId_idx" ON "vault_export_items"("exportId");

-- CreateIndex
CREATE INDEX "vault_imports_vaultId_status_idx" ON "vault_imports"("vaultId", "status");

-- CreateIndex
CREATE INDEX "vault_import_findings_importId_idx" ON "vault_import_findings"("importId");

-- CreateIndex
CREATE INDEX "vault_deletion_requests_vaultId_status_idx" ON "vault_deletion_requests"("vaultId", "status");

-- CreateIndex
CREATE INDEX "vault_deletion_receipts_requestId_idx" ON "vault_deletion_receipts"("requestId");

ALTER TABLE "personal_vaults" ADD CONSTRAINT "personal_vaults_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_items" ADD CONSTRAINT "vault_items_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_encrypted_envelopes" ADD CONSTRAINT "vault_encrypted_envelopes_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_encrypted_envelopes" ADD CONSTRAINT "vault_encrypted_envelopes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "vault_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vault_devices" ADD CONSTRAINT "vault_devices_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_devices" ADD CONSTRAINT "vault_devices_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_device_capabilities" ADD CONSTRAINT "vault_device_capabilities_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "vault_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_capabilities" ADD CONSTRAINT "vault_capabilities_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_capabilities" ADD CONSTRAINT "vault_capabilities_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "vault_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vault_capability_uses" ADD CONSTRAINT "vault_capability_uses_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "vault_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_disclosure_views" ADD CONSTRAINT "vault_disclosure_views_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_disclosure_views" ADD CONSTRAINT "vault_disclosure_views_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "vault_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vault_disclosure_receipts" ADD CONSTRAINT "vault_disclosure_receipts_disclosureId_fkey" FOREIGN KEY ("disclosureId") REFERENCES "vault_disclosure_views"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_trusted_contacts" ADD CONSTRAINT "vault_trusted_contacts_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_recovery_configurations" ADD CONSTRAINT "vault_recovery_configurations_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_recovery_requests" ADD CONSTRAINT "vault_recovery_requests_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_recovery_participants" ADD CONSTRAINT "vault_recovery_participants_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "vault_recovery_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_recovery_participants" ADD CONSTRAINT "vault_recovery_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vault_recovery_receipts" ADD CONSTRAINT "vault_recovery_receipts_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "vault_recovery_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_sync_operations" ADD CONSTRAINT "vault_sync_operations_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_sync_conflicts" ADD CONSTRAINT "vault_sync_conflicts_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "vault_sync_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_exports" ADD CONSTRAINT "vault_exports_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_export_items" ADD CONSTRAINT "vault_export_items_exportId_fkey" FOREIGN KEY ("exportId") REFERENCES "vault_exports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_imports" ADD CONSTRAINT "vault_imports_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_import_findings" ADD CONSTRAINT "vault_import_findings_importId_fkey" FOREIGN KEY ("importId") REFERENCES "vault_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_deletion_requests" ADD CONSTRAINT "vault_deletion_requests_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "personal_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_deletion_receipts" ADD CONSTRAINT "vault_deletion_receipts_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "vault_deletion_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
