-- Wave 5: external integration sandbox, remittance, reconciliation, kill switches

CREATE TYPE "ExternalIntegrationKind" AS ENUM (
  'ndia_simulator',
  'ndia_manual_portal',
  'ndia_direct_future',
  'ndia_aggregator',
  'plan_manager',
  'xero',
  'stripe',
  'email_delivery',
  'secure_file_delivery',
  'other'
);

CREATE TYPE "ExternalIntegrationEnvironment" AS ENUM (
  'local',
  'test',
  'sandbox',
  'certification',
  'production'
);

CREATE TYPE "ExternalIntegrationStatus" AS ENUM (
  'draft',
  'configuration_incomplete',
  'disabled',
  'test_ready',
  'conformance_testing',
  'certification_pending',
  'approved',
  'active',
  'suspended',
  'revoked',
  'retired'
);

CREATE TYPE "ExternalAuthenticationKind" AS ENUM (
  'none',
  'api_key',
  'oauth2_client_credentials',
  'oauth2_authorisation_code',
  'oauth2_private_key_jwt',
  'mutual_tls',
  'signed_request',
  'vendor_managed',
  'technical_pack_defined'
);

CREATE TYPE "ExternalDeliveryMode" AS ENUM (
  'synchronous_http',
  'asynchronous_http',
  'webhook',
  'polling',
  'secure_file',
  'manual_portal',
  'queue',
  'hybrid'
);

CREATE TYPE "ExternalIntegrationActivationDecision" AS ENUM (
  'approved',
  'rejected',
  'revoked',
  'expired'
);

CREATE TYPE "ExternalOutboxStatus" AS ENUM (
  'pending',
  'leased',
  'processing',
  'awaiting_acknowledgement',
  'completed',
  'retry_scheduled',
  'dead_letter',
  'cancelled',
  'submission_unknown'
);

CREATE TYPE "ExternalInboxStatus" AS ENUM (
  'received',
  'signature_invalid',
  'quarantined',
  'pending_processing',
  'processed',
  'failed',
  'duplicate'
);

CREATE TYPE "ExternalCanonicalStatus" AS ENUM (
  'prepared',
  'queued',
  'sent',
  'received',
  'acknowledged',
  'processing',
  'accepted',
  'held',
  'needs_information',
  'partially_approved',
  'partially_paid',
  'paid',
  'rejected',
  'cancelled',
  'reversed',
  'delivery_failed',
  'authentication_failed',
  'submission_unknown',
  'status_unknown'
);

CREATE TYPE "RemittanceMatchingStatus" AS ENUM (
  'unmatched',
  'candidate_match',
  'matched',
  'partially_matched',
  'amount_mismatch',
  'duplicate',
  'disputed',
  'rejected',
  'manual_review',
  'reconciled',
  'reversed'
);

CREATE TYPE "PaymentAllocationType" AS ENUM (
  'automatic_exact',
  'automatic_composite',
  'manual',
  'adjustment',
  'reversal',
  'refund',
  'recovery'
);

CREATE TYPE "PaymentAllocationStatus" AS ENUM (
  'active',
  'reversed',
  'disputed',
  'pending_review'
);

CREATE TYPE "IntegrationKillSwitchKey" AS ENUM (
  'global_outbound',
  'ndia_direct',
  'aggregator',
  'plan_manager_delivery',
  'xero',
  'stripe',
  'webhook_processing',
  'polling',
  'reconciliation_automation'
);

-- Prefer encrypted ciphertext / secret references; keep legacy plaintext columns.
ALTER TABLE "XeroOAuthToken" ADD COLUMN "accessTokenCiphertext" TEXT;
ALTER TABLE "XeroOAuthToken" ADD COLUMN "refreshTokenCiphertext" TEXT;
ALTER TABLE "XeroOAuthToken" ADD COLUMN "secretReference" TEXT;

CREATE TABLE "ExternalIntegrationProfile" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "kind" "ExternalIntegrationKind" NOT NULL,
  "providerKey" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "environment" "ExternalIntegrationEnvironment" NOT NULL,
  "status" "ExternalIntegrationStatus" NOT NULL DEFAULT 'draft',
  "adapterVersion" TEXT NOT NULL,
  "contractVersion" TEXT NOT NULL,
  "authenticationKind" "ExternalAuthenticationKind" NOT NULL,
  "deliveryMode" "ExternalDeliveryMode" NOT NULL,
  "baseUrlCiphertext" TEXT,
  "configurationCiphertext" TEXT,
  "publicConfigurationJson" JSONB,
  "secretReference" TEXT,
  "dataResidency" TEXT NOT NULL,
  "technicalSpecReference" TEXT,
  "technicalSpecChecksum" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "activatedById" TEXT,
  "activatedAt" TIMESTAMP(3),
  "suspendedAt" TIMESTAMP(3),
  "suspensionReason" TEXT,
  "lastHealthCheckAt" TIMESTAMP(3),
  "lastHealthStatus" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalIntegrationProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalIntegrationActivation" (
  "id" TEXT NOT NULL,
  "integrationProfileId" TEXT NOT NULL,
  "environment" "ExternalIntegrationEnvironment" NOT NULL,
  "decision" "ExternalIntegrationActivationDecision" NOT NULL,
  "approvedById" TEXT NOT NULL,
  "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT NOT NULL,
  "evidenceJson" JSONB,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalIntegrationActivation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalIntegrationOutbox" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "integrationProfileId" TEXT NOT NULL,
  "operationType" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "payloadReference" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "status" "ExternalOutboxStatus" NOT NULL DEFAULT 'pending',
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 8,
  "lastAttemptAt" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3),
  "deadlineAt" TIMESTAMP(3),
  "lastFailureClass" TEXT,
  "lastSafeFailureMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "ExternalIntegrationOutbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalIntegrationInbox" (
  "id" TEXT NOT NULL,
  "integrationProfileId" TEXT NOT NULL,
  "externalEventId" TEXT,
  "eventType" TEXT NOT NULL,
  "sourceChecksum" TEXT,
  "signatureStatus" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "status" "ExternalInboxStatus" NOT NULL DEFAULT 'received',
  "encryptedPayloadCiphertext" TEXT,
  "payloadHash" TEXT NOT NULL,
  "safeMetadataJson" JSONB,
  "correlationId" TEXT,
  "linkedSubmissionId" TEXT,
  "failureCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalIntegrationInbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalStatusPoll" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "integrationProfileId" TEXT NOT NULL,
  "externalReference" TEXT NOT NULL,
  "status" "ExternalCanonicalStatus" NOT NULL DEFAULT 'queued',
  "nextPollAt" TIMESTAMP(3) NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastPolledAt" TIMESTAMP(3),
  "lastExternalStatus" TEXT,
  "terminalAt" TIMESTAMP(3),
  "failureClass" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalStatusPoll_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalRemittance" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "integrationProfileId" TEXT NOT NULL,
  "externalRemittanceId" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceChecksum" TEXT NOT NULL,
  "paymentDate" TIMESTAMP(3),
  "settlementDate" TIMESTAMP(3),
  "totalCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "status" "RemittanceMatchingStatus" NOT NULL DEFAULT 'unmatched',
  "encryptedSourceCiphertext" TEXT,
  "safeMetadataJson" JSONB,
  "importedById" TEXT,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalRemittance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalRemittanceLine" (
  "id" TEXT NOT NULL,
  "remittanceId" TEXT NOT NULL,
  "externalClaimReference" TEXT,
  "externalInvoiceReference" TEXT,
  "externalLineReference" TEXT,
  "participantReferenceHash" TEXT,
  "supportItemCode" TEXT,
  "serviceDate" TIMESTAMP(3),
  "claimedCents" INTEGER,
  "approvedCents" INTEGER,
  "paidCents" INTEGER NOT NULL,
  "adjustmentCents" INTEGER NOT NULL DEFAULT 0,
  "rejectionCode" TEXT,
  "safeRejectionMessage" TEXT,
  "matchingStatus" "RemittanceMatchingStatus" NOT NULL DEFAULT 'unmatched',
  "linkedSubmissionId" TEXT,
  "linkedClaimSnapshotId" TEXT,
  "linkedBillableItemId" TEXT,
  "linkedDocumentLineId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalRemittanceLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisPaymentEvent" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "externalPaymentReference" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "status" "RemittanceMatchingStatus" NOT NULL DEFAULT 'unmatched',
  "sourceChecksum" TEXT,
  "safeMetadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdisPaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisPaymentAllocation" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "paymentEventId" TEXT NOT NULL,
  "remittanceLineId" TEXT,
  "billingDocumentId" TEXT,
  "billingDocumentLineId" TEXT,
  "billableItemId" TEXT,
  "claimSnapshotId" TEXT,
  "legacyInvoiceId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "allocationType" "PaymentAllocationType" NOT NULL,
  "status" "PaymentAllocationStatus" NOT NULL DEFAULT 'active',
  "allocatedById" TEXT,
  "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reversedAt" TIMESTAMP(3),
  "reversedById" TEXT,
  "reversalReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdisPaymentAllocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationKillSwitch" (
  "id" TEXT NOT NULL,
  "key" "IntegrationKillSwitchKey" NOT NULL,
  "engaged" BOOLEAN NOT NULL DEFAULT false,
  "engagedById" TEXT,
  "engagedAt" TIMESTAMP(3),
  "reason" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationKillSwitch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationIdempotencyRecord" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "resultJson" JSONB,
  "environment" "ExternalIntegrationEnvironment" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationIdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountingSyncRecord" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "integrationProfileId" TEXT,
  "billingDocumentId" TEXT,
  "xeroContactId" TEXT,
  "xeroInvoiceId" TEXT,
  "xeroCreditNoteId" TEXT,
  "xeroPaymentId" TEXT,
  "adapterVersion" TEXT,
  "syncStatus" "XeroSyncStatus" NOT NULL DEFAULT 'not_configured',
  "safeErrorMessage" TEXT,
  "safeMetadataJson" JSONB,
  "environment" "ExternalIntegrationEnvironment" NOT NULL DEFAULT 'sandbox',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountingSyncRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExternalIntegrationProfile_organisationId_kind_providerKey_environment_key" ON "ExternalIntegrationProfile"("organisationId", "kind", "providerKey", "environment");
CREATE INDEX "ExternalIntegrationProfile_kind_environment_status_idx" ON "ExternalIntegrationProfile"("kind", "environment", "status");
CREATE INDEX "ExternalIntegrationProfile_organisationId_status_idx" ON "ExternalIntegrationProfile"("organisationId", "status");
CREATE INDEX "ExternalIntegrationProfile_providerKey_environment_idx" ON "ExternalIntegrationProfile"("providerKey", "environment");

CREATE INDEX "ExternalIntegrationActivation_integrationProfileId_createdAt_idx" ON "ExternalIntegrationActivation"("integrationProfileId", "createdAt");
CREATE INDEX "ExternalIntegrationActivation_environment_decision_idx" ON "ExternalIntegrationActivation"("environment", "decision");

CREATE UNIQUE INDEX "ExternalIntegrationOutbox_integrationProfileId_operationType_idempotencyKey_key" ON "ExternalIntegrationOutbox"("integrationProfileId", "operationType", "idempotencyKey");
CREATE INDEX "ExternalIntegrationOutbox_organisationId_status_availableAt_idx" ON "ExternalIntegrationOutbox"("organisationId", "status", "availableAt");
CREATE INDEX "ExternalIntegrationOutbox_status_nextAttemptAt_idx" ON "ExternalIntegrationOutbox"("status", "nextAttemptAt");
CREATE INDEX "ExternalIntegrationOutbox_aggregateType_aggregateId_idx" ON "ExternalIntegrationOutbox"("aggregateType", "aggregateId");
CREATE INDEX "ExternalIntegrationOutbox_correlationId_idx" ON "ExternalIntegrationOutbox"("correlationId");

CREATE UNIQUE INDEX "ExternalIntegrationInbox_integrationProfileId_externalEventId_key" ON "ExternalIntegrationInbox"("integrationProfileId", "externalEventId");
CREATE UNIQUE INDEX "ExternalIntegrationInbox_integrationProfileId_sourceChecksum_key" ON "ExternalIntegrationInbox"("integrationProfileId", "sourceChecksum");
CREATE INDEX "ExternalIntegrationInbox_status_receivedAt_idx" ON "ExternalIntegrationInbox"("status", "receivedAt");
CREATE INDEX "ExternalIntegrationInbox_correlationId_idx" ON "ExternalIntegrationInbox"("correlationId");
CREATE INDEX "ExternalIntegrationInbox_linkedSubmissionId_idx" ON "ExternalIntegrationInbox"("linkedSubmissionId");

CREATE INDEX "ExternalStatusPoll_nextPollAt_status_idx" ON "ExternalStatusPoll"("nextPollAt", "status");
CREATE INDEX "ExternalStatusPoll_submissionId_idx" ON "ExternalStatusPoll"("submissionId");
CREATE INDEX "ExternalStatusPoll_integrationProfileId_status_idx" ON "ExternalStatusPoll"("integrationProfileId", "status");
CREATE INDEX "ExternalStatusPoll_externalReference_idx" ON "ExternalStatusPoll"("externalReference");

CREATE UNIQUE INDEX "ExternalRemittance_organisationId_sourceChecksum_key" ON "ExternalRemittance"("organisationId", "sourceChecksum");
CREATE INDEX "ExternalRemittance_organisationId_status_idx" ON "ExternalRemittance"("organisationId", "status");
CREATE INDEX "ExternalRemittance_integrationProfileId_importedAt_idx" ON "ExternalRemittance"("integrationProfileId", "importedAt");
CREATE INDEX "ExternalRemittance_externalRemittanceId_idx" ON "ExternalRemittance"("externalRemittanceId");

CREATE INDEX "ExternalRemittanceLine_remittanceId_matchingStatus_idx" ON "ExternalRemittanceLine"("remittanceId", "matchingStatus");
CREATE INDEX "ExternalRemittanceLine_externalClaimReference_idx" ON "ExternalRemittanceLine"("externalClaimReference");
CREATE INDEX "ExternalRemittanceLine_externalInvoiceReference_idx" ON "ExternalRemittanceLine"("externalInvoiceReference");
CREATE INDEX "ExternalRemittanceLine_linkedClaimSnapshotId_idx" ON "ExternalRemittanceLine"("linkedClaimSnapshotId");
CREATE INDEX "ExternalRemittanceLine_linkedBillableItemId_idx" ON "ExternalRemittanceLine"("linkedBillableItemId");
CREATE INDEX "ExternalRemittanceLine_linkedDocumentLineId_idx" ON "ExternalRemittanceLine"("linkedDocumentLineId");

CREATE UNIQUE INDEX "NdisPaymentEvent_organisationId_sourceChecksum_key" ON "NdisPaymentEvent"("organisationId", "sourceChecksum");
CREATE INDEX "NdisPaymentEvent_organisationId_status_idx" ON "NdisPaymentEvent"("organisationId", "status");
CREATE INDEX "NdisPaymentEvent_externalPaymentReference_idx" ON "NdisPaymentEvent"("externalPaymentReference");
CREATE INDEX "NdisPaymentEvent_occurredAt_idx" ON "NdisPaymentEvent"("occurredAt");

CREATE INDEX "NdisPaymentAllocation_organisationId_status_idx" ON "NdisPaymentAllocation"("organisationId", "status");
CREATE INDEX "NdisPaymentAllocation_paymentEventId_idx" ON "NdisPaymentAllocation"("paymentEventId");
CREATE INDEX "NdisPaymentAllocation_remittanceLineId_idx" ON "NdisPaymentAllocation"("remittanceLineId");
CREATE INDEX "NdisPaymentAllocation_billingDocumentId_idx" ON "NdisPaymentAllocation"("billingDocumentId");
CREATE INDEX "NdisPaymentAllocation_billableItemId_idx" ON "NdisPaymentAllocation"("billableItemId");
CREATE INDEX "NdisPaymentAllocation_claimSnapshotId_idx" ON "NdisPaymentAllocation"("claimSnapshotId");
CREATE INDEX "NdisPaymentAllocation_legacyInvoiceId_idx" ON "NdisPaymentAllocation"("legacyInvoiceId");

CREATE UNIQUE INDEX "IntegrationKillSwitch_key_key" ON "IntegrationKillSwitch"("key");

CREATE UNIQUE INDEX "IntegrationIdempotencyRecord_profileId_operation_idempotencyKey_key" ON "IntegrationIdempotencyRecord"("profileId", "operation", "idempotencyKey");
CREATE INDEX "IntegrationIdempotencyRecord_environment_createdAt_idx" ON "IntegrationIdempotencyRecord"("environment", "createdAt");

CREATE INDEX "AccountingSyncRecord_organisationId_syncStatus_idx" ON "AccountingSyncRecord"("organisationId", "syncStatus");
CREATE INDEX "AccountingSyncRecord_billingDocumentId_idx" ON "AccountingSyncRecord"("billingDocumentId");
CREATE INDEX "AccountingSyncRecord_xeroInvoiceId_idx" ON "AccountingSyncRecord"("xeroInvoiceId");
CREATE INDEX "AccountingSyncRecord_integrationProfileId_idx" ON "AccountingSyncRecord"("integrationProfileId");

ALTER TABLE "ExternalIntegrationProfile" ADD CONSTRAINT "ExternalIntegrationProfile_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalIntegrationProfile" ADD CONSTRAINT "ExternalIntegrationProfile_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalIntegrationProfile" ADD CONSTRAINT "ExternalIntegrationProfile_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExternalIntegrationActivation" ADD CONSTRAINT "ExternalIntegrationActivation_integrationProfileId_fkey" FOREIGN KEY ("integrationProfileId") REFERENCES "ExternalIntegrationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalIntegrationActivation" ADD CONSTRAINT "ExternalIntegrationActivation_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalIntegrationActivation" ADD CONSTRAINT "ExternalIntegrationActivation_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExternalIntegrationOutbox" ADD CONSTRAINT "ExternalIntegrationOutbox_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalIntegrationOutbox" ADD CONSTRAINT "ExternalIntegrationOutbox_integrationProfileId_fkey" FOREIGN KEY ("integrationProfileId") REFERENCES "ExternalIntegrationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExternalIntegrationInbox" ADD CONSTRAINT "ExternalIntegrationInbox_integrationProfileId_fkey" FOREIGN KEY ("integrationProfileId") REFERENCES "ExternalIntegrationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExternalStatusPoll" ADD CONSTRAINT "ExternalStatusPoll_integrationProfileId_fkey" FOREIGN KEY ("integrationProfileId") REFERENCES "ExternalIntegrationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExternalRemittance" ADD CONSTRAINT "ExternalRemittance_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalRemittance" ADD CONSTRAINT "ExternalRemittance_integrationProfileId_fkey" FOREIGN KEY ("integrationProfileId") REFERENCES "ExternalIntegrationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalRemittance" ADD CONSTRAINT "ExternalRemittance_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExternalRemittanceLine" ADD CONSTRAINT "ExternalRemittanceLine_remittanceId_fkey" FOREIGN KEY ("remittanceId") REFERENCES "ExternalRemittance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalRemittanceLine" ADD CONSTRAINT "ExternalRemittanceLine_linkedClaimSnapshotId_fkey" FOREIGN KEY ("linkedClaimSnapshotId") REFERENCES "NdisClaimSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalRemittanceLine" ADD CONSTRAINT "ExternalRemittanceLine_linkedBillableItemId_fkey" FOREIGN KEY ("linkedBillableItemId") REFERENCES "NdisBillableServiceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalRemittanceLine" ADD CONSTRAINT "ExternalRemittanceLine_linkedDocumentLineId_fkey" FOREIGN KEY ("linkedDocumentLineId") REFERENCES "NdisBillingDocumentLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NdisPaymentEvent" ADD CONSTRAINT "NdisPaymentEvent_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NdisPaymentAllocation" ADD CONSTRAINT "NdisPaymentAllocation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisPaymentAllocation" ADD CONSTRAINT "NdisPaymentAllocation_paymentEventId_fkey" FOREIGN KEY ("paymentEventId") REFERENCES "NdisPaymentEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisPaymentAllocation" ADD CONSTRAINT "NdisPaymentAllocation_remittanceLineId_fkey" FOREIGN KEY ("remittanceLineId") REFERENCES "ExternalRemittanceLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisPaymentAllocation" ADD CONSTRAINT "NdisPaymentAllocation_billingDocumentId_fkey" FOREIGN KEY ("billingDocumentId") REFERENCES "NdisBillingDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisPaymentAllocation" ADD CONSTRAINT "NdisPaymentAllocation_billingDocumentLineId_fkey" FOREIGN KEY ("billingDocumentLineId") REFERENCES "NdisBillingDocumentLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisPaymentAllocation" ADD CONSTRAINT "NdisPaymentAllocation_billableItemId_fkey" FOREIGN KEY ("billableItemId") REFERENCES "NdisBillableServiceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisPaymentAllocation" ADD CONSTRAINT "NdisPaymentAllocation_claimSnapshotId_fkey" FOREIGN KEY ("claimSnapshotId") REFERENCES "NdisClaimSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisPaymentAllocation" ADD CONSTRAINT "NdisPaymentAllocation_allocatedById_fkey" FOREIGN KEY ("allocatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisPaymentAllocation" ADD CONSTRAINT "NdisPaymentAllocation_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IntegrationKillSwitch" ADD CONSTRAINT "IntegrationKillSwitch_engagedById_fkey" FOREIGN KEY ("engagedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IntegrationIdempotencyRecord" ADD CONSTRAINT "IntegrationIdempotencyRecord_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ExternalIntegrationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccountingSyncRecord" ADD CONSTRAINT "AccountingSyncRecord_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountingSyncRecord" ADD CONSTRAINT "AccountingSyncRecord_integrationProfileId_fkey" FOREIGN KEY ("integrationProfileId") REFERENCES "ExternalIntegrationProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountingSyncRecord" ADD CONSTRAINT "AccountingSyncRecord_billingDocumentId_fkey" FOREIGN KEY ("billingDocumentId") REFERENCES "NdisBillingDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
