-- CreateEnum
CREATE TYPE "AbilityPayPlanStatus" AS ENUM ('draft', 'active', 'ended');
CREATE TYPE "AbilityPayPriceLimitStatus" AS ENUM ('pass', 'warning', 'fail', 'unknown');
CREATE TYPE "AbilityPayInvoiceStatus" AS ENUM ('draft', 'submitted', 'in_review', 'awaiting_participant', 'approved', 'rejected', 'exported');
CREATE TYPE "AbilityPayPaymentStatus" AS ENUM ('pending_review', 'approved', 'rejected', 'ready_to_pay', 'paid_mock', 'on_hold');
CREATE TYPE "AbilityPayRiskSeverity" AS ENUM ('info', 'warning', 'error');
CREATE TYPE "AbilityPayRiskFlagType" AS ENUM ('duplicate', 'price_over_limit', 'missing_field', 'ai_suggested', 'service_agreement_missing');
CREATE TYPE "AbilityPayApprovalDecision" AS ENUM ('approved', 'rejected', 'queried');
CREATE TYPE "AbilityPayConsentScopeType" AS ENUM ('abilitypay_plan_view', 'abilitypay_invoice_view', 'abilitypay_invoice_approve', 'abilitypay_budget_manage', 'abilitypay_export');
CREATE TYPE "AbilityPayProviderCredentialStatus" AS ENUM ('pending', 'verified', 'expired', 'rejected');

-- CreateTable
CREATE TABLE "AbilityPayParticipantPlan" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ndisNumber" TEXT,
    "status" "AbilityPayPlanStatus" NOT NULL DEFAULT 'draft',
    "planStartAt" TIMESTAMP(3),
    "planEndAt" TIMESTAMP(3),
    "totalBudgetCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbilityPayParticipantPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbilityPayBudgetCategory" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryCode" TEXT,
    "allocatedCents" INTEGER NOT NULL DEFAULT 0,
    "spentCents" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbilityPayBudgetCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbilityPayFundingPeriod" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbilityPayFundingPeriod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbilityPayProvider" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "abn" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "organisationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbilityPayProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbilityPayProviderCredential" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "status" "AbilityPayProviderCredentialStatus" NOT NULL DEFAULT 'pending',
    "referenceNumber" TEXT,
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbilityPayProviderCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbilityPayInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "participantId" TEXT NOT NULL,
    "providerId" TEXT,
    "planId" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "AbilityPayInvoiceStatus" NOT NULL DEFAULT 'draft',
    "paymentStatus" "AbilityPayPaymentStatus" NOT NULL DEFAULT 'pending_review',
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "serviceAgreementId" TEXT,
    "serviceAgreementLinked" BOOLEAN NOT NULL DEFAULT false,
    "validationJson" JSONB,
    "aiSuggestionsJson" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbilityPayInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbilityPayInvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "supportItemCode" TEXT,
    "priceLimitStatus" "AbilityPayPriceLimitStatus" NOT NULL DEFAULT 'unknown',
    "budgetCategoryId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbilityPayInvoiceLineItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbilityPayInvoiceAttachment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbilityPayInvoiceAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbilityPayApprovalEvent" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "decision" "AbilityPayApprovalDecision" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbilityPayApprovalEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbilityPayClaimPack" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "planId" TEXT,
    "createdById" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "fileName" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbilityPayClaimPack_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbilityPayConsentGrant" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "grantedToUserId" TEXT NOT NULL,
    "planId" TEXT,
    "scope" "AbilityPayConsentScopeType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbilityPayConsentGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbilityPayRiskFlag" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "flagType" "AbilityPayRiskFlagType" NOT NULL,
    "severity" "AbilityPayRiskSeverity" NOT NULL DEFAULT 'warning',
    "message" TEXT NOT NULL,
    "fieldKey" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbilityPayRiskFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AbilityPayParticipantPlan_participantId_status_idx" ON "AbilityPayParticipantPlan"("participantId", "status");
CREATE INDEX "AbilityPayParticipantPlan_createdAt_idx" ON "AbilityPayParticipantPlan"("createdAt");
CREATE INDEX "AbilityPayBudgetCategory_planId_idx" ON "AbilityPayBudgetCategory"("planId");
CREATE INDEX "AbilityPayFundingPeriod_planId_idx" ON "AbilityPayFundingPeriod"("planId");
CREATE INDEX "AbilityPayProvider_organisationId_idx" ON "AbilityPayProvider"("organisationId");
CREATE INDEX "AbilityPayProvider_abn_idx" ON "AbilityPayProvider"("abn");
CREATE INDEX "AbilityPayProviderCredential_providerId_idx" ON "AbilityPayProviderCredential"("providerId");
CREATE INDEX "AbilityPayInvoice_participantId_status_idx" ON "AbilityPayInvoice"("participantId", "status");
CREATE INDEX "AbilityPayInvoice_providerId_idx" ON "AbilityPayInvoice"("providerId");
CREATE INDEX "AbilityPayInvoice_planId_idx" ON "AbilityPayInvoice"("planId");
CREATE INDEX "AbilityPayInvoice_invoiceNumber_idx" ON "AbilityPayInvoice"("invoiceNumber");
CREATE INDEX "AbilityPayInvoiceLineItem_invoiceId_idx" ON "AbilityPayInvoiceLineItem"("invoiceId");
CREATE INDEX "AbilityPayInvoiceLineItem_budgetCategoryId_idx" ON "AbilityPayInvoiceLineItem"("budgetCategoryId");
CREATE INDEX "AbilityPayInvoiceAttachment_invoiceId_idx" ON "AbilityPayInvoiceAttachment"("invoiceId");
CREATE INDEX "AbilityPayApprovalEvent_invoiceId_idx" ON "AbilityPayApprovalEvent"("invoiceId");
CREATE INDEX "AbilityPayApprovalEvent_actorUserId_idx" ON "AbilityPayApprovalEvent"("actorUserId");
CREATE INDEX "AbilityPayClaimPack_invoiceId_idx" ON "AbilityPayClaimPack"("invoiceId");
CREATE INDEX "AbilityPayClaimPack_createdById_idx" ON "AbilityPayClaimPack"("createdById");
CREATE INDEX "AbilityPayConsentGrant_subjectUserId_grantedToUserId_idx" ON "AbilityPayConsentGrant"("subjectUserId", "grantedToUserId");
CREATE INDEX "AbilityPayConsentGrant_planId_idx" ON "AbilityPayConsentGrant"("planId");
CREATE INDEX "AbilityPayRiskFlag_invoiceId_idx" ON "AbilityPayRiskFlag"("invoiceId");
CREATE INDEX "AbilityPayRiskFlag_flagType_idx" ON "AbilityPayRiskFlag"("flagType");

-- AddForeignKey
ALTER TABLE "AbilityPayParticipantPlan" ADD CONSTRAINT "AbilityPayParticipantPlan_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbilityPayParticipantPlan" ADD CONSTRAINT "AbilityPayParticipantPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AbilityPayBudgetCategory" ADD CONSTRAINT "AbilityPayBudgetCategory_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AbilityPayParticipantPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbilityPayFundingPeriod" ADD CONSTRAINT "AbilityPayFundingPeriod_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AbilityPayParticipantPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbilityPayProvider" ADD CONSTRAINT "AbilityPayProvider_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AbilityPayProviderCredential" ADD CONSTRAINT "AbilityPayProviderCredential_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AbilityPayProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbilityPayInvoice" ADD CONSTRAINT "AbilityPayInvoice_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbilityPayInvoice" ADD CONSTRAINT "AbilityPayInvoice_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AbilityPayProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AbilityPayInvoice" ADD CONSTRAINT "AbilityPayInvoice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AbilityPayParticipantPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AbilityPayInvoice" ADD CONSTRAINT "AbilityPayInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AbilityPayInvoiceLineItem" ADD CONSTRAINT "AbilityPayInvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AbilityPayInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbilityPayInvoiceLineItem" ADD CONSTRAINT "AbilityPayInvoiceLineItem_budgetCategoryId_fkey" FOREIGN KEY ("budgetCategoryId") REFERENCES "AbilityPayBudgetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AbilityPayInvoiceAttachment" ADD CONSTRAINT "AbilityPayInvoiceAttachment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AbilityPayInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbilityPayApprovalEvent" ADD CONSTRAINT "AbilityPayApprovalEvent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AbilityPayInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbilityPayApprovalEvent" ADD CONSTRAINT "AbilityPayApprovalEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AbilityPayClaimPack" ADD CONSTRAINT "AbilityPayClaimPack_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AbilityPayInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AbilityPayClaimPack" ADD CONSTRAINT "AbilityPayClaimPack_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AbilityPayConsentGrant" ADD CONSTRAINT "AbilityPayConsentGrant_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbilityPayConsentGrant" ADD CONSTRAINT "AbilityPayConsentGrant_grantedToUserId_fkey" FOREIGN KEY ("grantedToUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbilityPayConsentGrant" ADD CONSTRAINT "AbilityPayConsentGrant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AbilityPayParticipantPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AbilityPayRiskFlag" ADD CONSTRAINT "AbilityPayRiskFlag_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AbilityPayInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
