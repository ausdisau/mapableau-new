-- Wave 4: canonical billable items, evidence, documents, workflows

CREATE TYPE "NdisBillableItemStatus" AS ENUM (
  'draft',
  'evidence_pending',
  'participant_confirmation_pending',
  'funding_route_pending',
  'pricing_pending',
  'validation_failed',
  'ready',
  'locked',
  'invoiced',
  'claim_packaged',
  'dispatched',
  'partially_paid',
  'paid',
  'rejected',
  'disputed',
  'correction_required',
  'corrected',
  'reversed',
  'voided',
  'archived',
  'migrated_review_required'
);

CREATE TYPE "NdisPaymentDestination" AS ENUM (
  'participant',
  'nominee',
  'plan_manager',
  'ndia_portal_export',
  'ndia_api_future',
  'private_payer',
  'no_payment',
  'unresolved'
);

CREATE TYPE "NdisBillingRoute" AS ENUM (
  'ndis_self_managed',
  'ndis_plan_managed',
  'ndis_ndia_managed',
  'private_pay',
  'pro_bono',
  'grant_funded',
  'employer_funded',
  'health_funded',
  'other',
  'unresolved'
);

CREATE TYPE "NdisEvidenceStatus" AS ENUM (
  'missing',
  'incomplete',
  'ready_for_confirmation',
  'participant_confirmed',
  'delegate_confirmed',
  'exception_recorded',
  'disputed',
  'locked',
  'superseded'
);

CREATE TYPE "NdisConfirmationMethod" AS ENUM (
  'participant_portal',
  'participant_signature',
  'nominee_portal',
  'guardian_confirmation',
  'support_log_signature',
  'verbal_confirmation_documented',
  'inaccessible_confirmation_exception',
  'provider_exception',
  'not_required',
  'aac_assisted',
  'switch_accessible'
);

CREATE TYPE "NdisDocumentKind" AS ENUM (
  'self_managed_invoice',
  'plan_manager_invoice',
  'private_pay_invoice',
  'ndia_payment_request_package',
  'portal_bulk_upload',
  'credit_note',
  'adjustment_note',
  'service_statement',
  'evidence_summary',
  'remittance_advice',
  'receipt'
);

CREATE TYPE "NdisDocumentStatus" AS ENUM (
  'draft',
  'generated',
  'pending_approval',
  'approved',
  'issued',
  'mock_delivered',
  'delivered',
  'acknowledged',
  'voided',
  'superseded',
  'failed'
);

CREATE TYPE "NdisDispatchStatus" AS ENUM (
  'not_ready',
  'ready',
  'approval_required',
  'approved',
  'generated',
  'delivered',
  'acknowledged',
  'failed',
  'cancelled',
  'superseded',
  'manually_submitted'
);

CREATE TYPE "NdisCorrectionType" AS ENUM (
  'administrative',
  'service_date',
  'support_item',
  'quantity',
  'unit_price',
  'participant',
  'payment_route',
  'duplicate',
  'cancellation',
  'travel',
  'tax',
  'recipient',
  'complete_reversal'
);

CREATE TYPE "NdisBillingDisputeStatus" AS ENUM (
  'open',
  'under_review',
  'payment_held',
  'resolved',
  'withdrawn',
  'escalated'
);

CREATE TYPE "NdisBillingDisputeCategory" AS ENUM (
  'service_not_delivered',
  'wrong_date',
  'wrong_duration',
  'wrong_support_item',
  'wrong_price',
  'duplicate_charge',
  'cancellation_disagreement',
  'travel_disagreement',
  'provider_identity',
  'other'
);

CREATE TYPE "NdisBillingBatchStatus" AS ENUM (
  'draft',
  'validating',
  'ready',
  'preparing',
  'prepared',
  'failed',
  'cancelled',
  'closed'
);

CREATE TYPE "NdisChargeType" AS ENUM (
  'support',
  'provider_travel_labour',
  'provider_travel_non_labour',
  'activity_based_transport',
  'cancellation',
  'report_writing',
  'non_face_to_face',
  'other'
);

CREATE TABLE "NdisRouteDecision" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "participantId" TEXT,
  "billableItemId" TEXT,
  "billingRoute" "NdisBillingRoute" NOT NULL,
  "ndisPaymentRoute" "NdisPaymentRoute",
  "paymentDestination" "NdisPaymentDestination" NOT NULL,
  "destinationEntityId" TEXT,
  "decisionStatus" TEXT NOT NULL,
  "matchedFundingSourceId" TEXT,
  "matchedServiceAgreementId" TEXT,
  "warningsJson" JSONB,
  "blockingIssuesJson" JSONB,
  "provenanceJson" JSONB,
  "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
  "resolverVersion" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "overrideReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdisRouteDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisBillableServiceItem" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "participantId" TEXT,
  "serviceAgreementId" TEXT,
  "fundingSourceId" TEXT,
  "bookingId" TEXT,
  "careShiftId" TEXT,
  "timesheetId" TEXT,
  "deliveryEventId" TEXT,
  "legacyClaimLineId" TEXT,
  "legacyNdiaClaimId" TEXT,
  "correctedFromId" TEXT,
  "supersededById" TEXT,
  "billingRoute" "NdisBillingRoute" NOT NULL,
  "ndisPaymentRoute" "NdisPaymentRoute",
  "paymentDestination" "NdisPaymentDestination" NOT NULL,
  "chargeType" "NdisChargeType" NOT NULL DEFAULT 'support',
  "supportItemCode" TEXT,
  "supportItemId" TEXT,
  "supportDescription" TEXT NOT NULL,
  "claimType" TEXT,
  "deliveryMechanism" TEXT,
  "serviceStartAt" TIMESTAMP(3) NOT NULL,
  "serviceEndAt" TIMESTAMP(3) NOT NULL,
  "serviceTimezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
  "quantity" DECIMAL(12,4) NOT NULL,
  "unitType" TEXT NOT NULL,
  "agreedUnitPriceCents" INTEGER,
  "resolvedMaximumPriceCents" INTEGER,
  "unitPriceCents" INTEGER,
  "subtotalCents" INTEGER,
  "gstCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER,
  "pricingReleaseId" TEXT,
  "pricingRowId" TEXT,
  "pricingResolverVersion" TEXT,
  "pricingProvenanceJson" JSONB,
  "claimSnapshotId" TEXT,
  "routeDecisionId" TEXT,
  "status" "NdisBillableItemStatus" NOT NULL DEFAULT 'draft',
  "sourceKey" TEXT NOT NULL,
  "correctionGeneration" INTEGER NOT NULL DEFAULT 0,
  "paymentHold" BOOLEAN NOT NULL DEFAULT false,
  "lockedAt" TIMESTAMP(3),
  "lockedById" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "supersededAt" TIMESTAMP(3),
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "blockingIssuesJson" JSONB,
  "warningsJson" JSONB,
  CONSTRAINT "NdisBillableServiceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisServiceEvidencePackage" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "billableItemId" TEXT NOT NULL,
  "serviceAgreementId" TEXT,
  "bookingId" TEXT,
  "shiftId" TEXT,
  "timesheetId" TEXT,
  "deliveryEventId" TEXT,
  "status" "NdisEvidenceStatus" NOT NULL DEFAULT 'incomplete',
  "serviceStartAt" TIMESTAMP(3) NOT NULL,
  "serviceEndAt" TIMESTAMP(3) NOT NULL,
  "supportItemCode" TEXT,
  "quantity" DECIMAL(12,4) NOT NULL,
  "workerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "participantConfirmationMethod" "NdisConfirmationMethod",
  "participantConfirmedAt" TIMESTAMP(3),
  "participantConfirmedById" TEXT,
  "exceptionCode" TEXT,
  "exceptionReason" TEXT,
  "exceptionRecordedById" TEXT,
  "disputedAt" TIMESTAMP(3),
  "disputedById" TEXT,
  "disputeReason" TEXT,
  "evidenceHash" TEXT NOT NULL,
  "schemaVersion" TEXT NOT NULL DEFAULT '1',
  "lockedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "supersededAt" TIMESTAMP(3),
  CONSTRAINT "NdisServiceEvidencePackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisEvidenceReference" (
  "id" TEXT NOT NULL,
  "evidencePackageId" TEXT NOT NULL,
  "referenceType" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "safeLabel" TEXT NOT NULL,
  "checksum" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdisEvidenceReference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingNumberSequence" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "documentKind" "NdisDocumentKind" NOT NULL,
  "financialYear" INTEGER NOT NULL,
  "nextNumber" INTEGER NOT NULL DEFAULT 1,
  "prefix" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingNumberSequence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisBillingBatch" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "billingRoute" "NdisBillingRoute" NOT NULL,
  "status" "NdisBillingBatchStatus" NOT NULL DEFAULT 'draft',
  "batchReference" TEXT NOT NULL,
  "exportFileName" TEXT,
  "exportChecksum" TEXT,
  "exportedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "idempotencyKey" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NdisBillingBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisBillingDocument" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "participantId" TEXT,
  "recipientEntityId" TEXT,
  "billingRoute" "NdisBillingRoute" NOT NULL,
  "documentKind" "NdisDocumentKind" NOT NULL,
  "documentNumber" TEXT NOT NULL,
  "status" "NdisDocumentStatus" NOT NULL DEFAULT 'draft',
  "issueDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "subtotalCents" INTEGER NOT NULL DEFAULT 0,
  "gstCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL DEFAULT 0,
  "contentHash" TEXT NOT NULL,
  "safeDocumentJson" JSONB NOT NULL,
  "privateFileReference" TEXT,
  "supersedesDocumentId" TEXT,
  "billingBatchId" TEXT,
  "dispatchStatus" "NdisDispatchStatus" NOT NULL DEFAULT 'not_ready',
  "createdById" TEXT NOT NULL,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "acknowledgedAt" TIMESTAMP(3),
  "manuallySubmittedAt" TIMESTAMP(3),
  "manuallySubmittedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  CONSTRAINT "NdisBillingDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisBillingDocumentLine" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "billableItemId" TEXT NOT NULL,
  "supportItemCode" TEXT,
  "description" TEXT NOT NULL,
  "serviceStartAt" TIMESTAMP(3) NOT NULL,
  "serviceEndAt" TIMESTAMP(3) NOT NULL,
  "quantity" DECIMAL(12,4) NOT NULL,
  "unitType" TEXT NOT NULL,
  "unitPriceCents" INTEGER NOT NULL,
  "subtotalCents" INTEGER NOT NULL,
  "gstCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL,
  "claimType" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdisBillingDocumentLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisBillingBatchMember" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "billableItemId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdisBillingBatchMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisWorkflowTransition" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "fromStatus" TEXT NOT NULL,
  "toStatus" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "reason" TEXT,
  "correlationId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdisWorkflowTransition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisBillingDispute" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "billableItemId" TEXT,
  "documentId" TEXT,
  "claimSnapshotId" TEXT,
  "raisedById" TEXT NOT NULL,
  "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "category" "NdisBillingDisputeCategory" NOT NULL,
  "description" TEXT NOT NULL,
  "status" "NdisBillingDisputeStatus" NOT NULL DEFAULT 'open',
  "paymentHold" BOOLEAN NOT NULL DEFAULT true,
  "assignedToId" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolution" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NdisBillingDispute_pkey" PRIMARY KEY ("id")
);

-- Uniques
CREATE UNIQUE INDEX "NdisBillableServiceItem_organisationId_sourceKey_key" ON "NdisBillableServiceItem"("organisationId", "sourceKey");
CREATE UNIQUE INDEX "NdisServiceEvidencePackage_billableItemId_key" ON "NdisServiceEvidencePackage"("billableItemId");
CREATE UNIQUE INDEX "BillingNumberSequence_organisationId_documentKind_financialYear_key" ON "BillingNumberSequence"("organisationId", "documentKind", "financialYear");
CREATE UNIQUE INDEX "NdisBillingDocument_organisationId_documentNumber_key" ON "NdisBillingDocument"("organisationId", "documentNumber");
CREATE UNIQUE INDEX "NdisBillingBatch_idempotencyKey_key" ON "NdisBillingBatch"("idempotencyKey");
CREATE UNIQUE INDEX "NdisBillingBatch_organisationId_batchReference_key" ON "NdisBillingBatch"("organisationId", "batchReference");
CREATE UNIQUE INDEX "NdisBillingBatchMember_batchId_billableItemId_key" ON "NdisBillingBatchMember"("batchId", "billableItemId");

-- Indexes
CREATE INDEX "NdisBillableServiceItem_organisationId_status_idx" ON "NdisBillableServiceItem"("organisationId", "status");
CREATE INDEX "NdisBillableServiceItem_participantId_serviceStartAt_idx" ON "NdisBillableServiceItem"("participantId", "serviceStartAt");
CREATE INDEX "NdisBillableServiceItem_bookingId_idx" ON "NdisBillableServiceItem"("bookingId");
CREATE INDEX "NdisBillableServiceItem_billingRoute_status_idx" ON "NdisBillableServiceItem"("billingRoute", "status");
CREATE INDEX "NdisBillableServiceItem_legacyClaimLineId_idx" ON "NdisBillableServiceItem"("legacyClaimLineId");
CREATE INDEX "NdisBillableServiceItem_claimSnapshotId_idx" ON "NdisBillableServiceItem"("claimSnapshotId");
CREATE INDEX "NdisBillableServiceItem_supportItemCode_idx" ON "NdisBillableServiceItem"("supportItemCode");
CREATE INDEX "NdisServiceEvidencePackage_organisationId_status_idx" ON "NdisServiceEvidencePackage"("organisationId", "status");
CREATE INDEX "NdisServiceEvidencePackage_participantId_status_idx" ON "NdisServiceEvidencePackage"("participantId", "status");
CREATE INDEX "NdisServiceEvidencePackage_evidenceHash_idx" ON "NdisServiceEvidencePackage"("evidenceHash");
CREATE INDEX "NdisEvidenceReference_evidencePackageId_idx" ON "NdisEvidenceReference"("evidencePackageId");
CREATE INDEX "NdisEvidenceReference_referenceType_referenceId_idx" ON "NdisEvidenceReference"("referenceType", "referenceId");
CREATE INDEX "NdisRouteDecision_organisationId_createdAt_idx" ON "NdisRouteDecision"("organisationId", "createdAt");
CREATE INDEX "NdisRouteDecision_participantId_idx" ON "NdisRouteDecision"("participantId");
CREATE INDEX "BillingNumberSequence_organisationId_idx" ON "BillingNumberSequence"("organisationId");
CREATE INDEX "NdisBillingDocument_organisationId_status_idx" ON "NdisBillingDocument"("organisationId", "status");
CREATE INDEX "NdisBillingDocument_participantId_idx" ON "NdisBillingDocument"("participantId");
CREATE INDEX "NdisBillingDocument_documentKind_status_idx" ON "NdisBillingDocument"("documentKind", "status");
CREATE INDEX "NdisBillingDocument_billingBatchId_idx" ON "NdisBillingDocument"("billingBatchId");
CREATE INDEX "NdisBillingDocument_contentHash_idx" ON "NdisBillingDocument"("contentHash");
CREATE INDEX "NdisBillingDocumentLine_documentId_idx" ON "NdisBillingDocumentLine"("documentId");
CREATE INDEX "NdisBillingDocumentLine_billableItemId_active_idx" ON "NdisBillingDocumentLine"("billableItemId", "active");
CREATE INDEX "NdisBillingBatch_organisationId_status_idx" ON "NdisBillingBatch"("organisationId", "status");
CREATE INDEX "NdisBillingBatch_billingRoute_status_idx" ON "NdisBillingBatch"("billingRoute", "status");
CREATE INDEX "NdisBillingBatchMember_billableItemId_idx" ON "NdisBillingBatchMember"("billableItemId");
CREATE INDEX "NdisWorkflowTransition_organisationId_createdAt_idx" ON "NdisWorkflowTransition"("organisationId", "createdAt");
CREATE INDEX "NdisWorkflowTransition_entityType_entityId_createdAt_idx" ON "NdisWorkflowTransition"("entityType", "entityId", "createdAt");
CREATE INDEX "NdisBillingDispute_organisationId_status_idx" ON "NdisBillingDispute"("organisationId", "status");
CREATE INDEX "NdisBillingDispute_participantId_status_idx" ON "NdisBillingDispute"("participantId", "status");
CREATE INDEX "NdisBillingDispute_billableItemId_idx" ON "NdisBillingDispute"("billableItemId");

-- Foreign keys
ALTER TABLE "NdisRouteDecision" ADD CONSTRAINT "NdisRouteDecision_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisRouteDecision" ADD CONSTRAINT "NdisRouteDecision_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NdisBillableServiceItem" ADD CONSTRAINT "NdisBillableServiceItem_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisBillableServiceItem" ADD CONSTRAINT "NdisBillableServiceItem_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisBillableServiceItem" ADD CONSTRAINT "NdisBillableServiceItem_correctedFromId_fkey" FOREIGN KEY ("correctedFromId") REFERENCES "NdisBillableServiceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisBillableServiceItem" ADD CONSTRAINT "NdisBillableServiceItem_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "NdisBillableServiceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisBillableServiceItem" ADD CONSTRAINT "NdisBillableServiceItem_routeDecisionId_fkey" FOREIGN KEY ("routeDecisionId") REFERENCES "NdisRouteDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisBillableServiceItem" ADD CONSTRAINT "NdisBillableServiceItem_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisBillableServiceItem" ADD CONSTRAINT "NdisBillableServiceItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NdisServiceEvidencePackage" ADD CONSTRAINT "NdisServiceEvidencePackage_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisServiceEvidencePackage" ADD CONSTRAINT "NdisServiceEvidencePackage_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisServiceEvidencePackage" ADD CONSTRAINT "NdisServiceEvidencePackage_billableItemId_fkey" FOREIGN KEY ("billableItemId") REFERENCES "NdisBillableServiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisServiceEvidencePackage" ADD CONSTRAINT "NdisServiceEvidencePackage_participantConfirmedById_fkey" FOREIGN KEY ("participantConfirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisServiceEvidencePackage" ADD CONSTRAINT "NdisServiceEvidencePackage_disputedById_fkey" FOREIGN KEY ("disputedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NdisEvidenceReference" ADD CONSTRAINT "NdisEvidenceReference_evidencePackageId_fkey" FOREIGN KEY ("evidencePackageId") REFERENCES "NdisServiceEvidencePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BillingNumberSequence" ADD CONSTRAINT "BillingNumberSequence_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NdisBillingBatch" ADD CONSTRAINT "NdisBillingBatch_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NdisBillingDocument" ADD CONSTRAINT "NdisBillingDocument_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisBillingDocument" ADD CONSTRAINT "NdisBillingDocument_supersedesDocumentId_fkey" FOREIGN KEY ("supersedesDocumentId") REFERENCES "NdisBillingDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisBillingDocument" ADD CONSTRAINT "NdisBillingDocument_billingBatchId_fkey" FOREIGN KEY ("billingBatchId") REFERENCES "NdisBillingBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisBillingDocument" ADD CONSTRAINT "NdisBillingDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NdisBillingDocument" ADD CONSTRAINT "NdisBillingDocument_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NdisBillingDocumentLine" ADD CONSTRAINT "NdisBillingDocumentLine_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "NdisBillingDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisBillingDocumentLine" ADD CONSTRAINT "NdisBillingDocumentLine_billableItemId_fkey" FOREIGN KEY ("billableItemId") REFERENCES "NdisBillableServiceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NdisBillingBatchMember" ADD CONSTRAINT "NdisBillingBatchMember_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "NdisBillingBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisBillingBatchMember" ADD CONSTRAINT "NdisBillingBatchMember_billableItemId_fkey" FOREIGN KEY ("billableItemId") REFERENCES "NdisBillableServiceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NdisWorkflowTransition" ADD CONSTRAINT "NdisWorkflowTransition_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisWorkflowTransition" ADD CONSTRAINT "NdisWorkflowTransition_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NdisBillingDispute" ADD CONSTRAINT "NdisBillingDispute_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisBillingDispute" ADD CONSTRAINT "NdisBillingDispute_billableItemId_fkey" FOREIGN KEY ("billableItemId") REFERENCES "NdisBillableServiceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisBillingDispute" ADD CONSTRAINT "NdisBillingDispute_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "NdisBillingDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisBillingDispute" ADD CONSTRAINT "NdisBillingDispute_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NdisBillingDispute" ADD CONSTRAINT "NdisBillingDispute_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
