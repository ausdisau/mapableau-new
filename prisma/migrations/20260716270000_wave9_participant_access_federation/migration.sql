-- MapAble Wave 9: participant-controlled credentials and consent federation.
-- Forward-only. All new enums / models are additive; existing consent semantics
-- are preserved. ConsentRecord.directiveId is an optional bridge FK.
--
-- Federation != participant data access. Relationship != authority.
-- AI must not grant consent, sign credentials, approve delegation, complete
-- high-risk recovery, approve emergency access, or establish issuer trust.
-- MapAble credentials are NOT government credentials.

-- ============================================================================
-- Enums
-- ============================================================================

CREATE TYPE "ConsentDirectiveDecision" AS ENUM (
  'active', 'denied', 'withdrawn', 'superseded', 'expired'
);

CREATE TYPE "ConsentDirectiveStatus" AS ENUM (
  'draft', 'active', 'withdrawn', 'expired', 'superseded'
);

CREATE TYPE "ConsentRecipientCategory" AS ENUM (
  'self', 'family_or_informal_supporter', 'emergency_contact',
  'support_coordinator', 'plan_manager', 'registered_provider',
  'unregistered_provider', 'government_agency', 'research_partner',
  'external_verifier', 'external_app', 'federation_partner',
  'mapable_internal_ops'
);

CREATE TYPE "ConsentPurpose" AS ENUM (
  'service_delivery', 'billing', 'safeguarding', 'accessibility_share',
  'transport_coordination', 'care_coordination', 'emergency_response',
  'research_deidentified', 'regulatory_reporting', 'quality_improvement',
  'external_verification', 'portability_export', 'audit_and_compliance'
);

CREATE TYPE "ConsentFrequency" AS ENUM (
  'one_time', 'session_bound', 'ongoing_until_revoked', 'fixed_period',
  'event_bound'
);

CREATE TYPE "PortableClaimProvenance" AS ENUM (
  'self_asserted', 'platform_asserted', 'provider_asserted',
  'third_party_asserted', 'externally_verified'
);

CREATE TYPE "PortableClaimCategory" AS ENUM (
  'accessibility_preference', 'communication_preference',
  'environmental_need', 'service_history', 'provider_relationship',
  'training_or_accreditation', 'peer_endorsement', 'contact_reference',
  'lived_experience_note', 'emergency_instruction'
);

CREATE TYPE "DelegateRelationshipKind" AS ENUM (
  'family_member', 'informal_supporter', 'emergency_contact',
  'legal_guardian', 'power_of_attorney_personal',
  'power_of_attorney_financial', 'nominee_ndis', 'professional_advocate',
  'paid_supporter', 'none'
);

CREATE TYPE "DelegateAuthorityCategory" AS ENUM (
  'view_only', 'contact_and_scheduling', 'service_coordination',
  'billing_view', 'billing_manage', 'legal_representation',
  'emergency_action', 'identity_recovery_assist'
);

CREATE TYPE "DelegateAuthorityStatus" AS ENUM (
  'proposed', 'active', 'suspended', 'revoked', 'expired'
);

CREATE TYPE "DelegateAuthorityVerification" AS ENUM (
  'self_asserted', 'platform_verified', 'document_verified',
  'legal_instrument_verified'
);

CREATE TYPE "CredentialTrustLevel" AS ENUM (
  'untrusted', 'observed', 'allowed_verifier', 'allowed_issuer',
  'fully_trusted'
);

CREATE TYPE "CredentialTrustStatus" AS ENUM (
  'proposed', 'active', 'suspended', 'revoked'
);

CREATE TYPE "CredentialSchemaKind" AS ENUM (
  'access_passport', 'accessibility_preference', 'service_history',
  'provider_endorsement', 'self_asserted_preference', 'peer_endorsement',
  'emergency_instruction', 'portability_receipt'
);

CREATE TYPE "CredentialIssuanceMode" AS ENUM (
  'simulator_only', 'operator_review_required', 'automated_low_risk',
  'disabled'
);

CREATE TYPE "CredentialIssuanceStatus" AS ENUM (
  'offered', 'accepted', 'issued', 'rejected', 'revoked', 'expired'
);

CREATE TYPE "CredentialPresentationStatus" AS ENUM (
  'requested', 'approved_by_participant', 'presented', 'rejected', 'expired'
);

CREATE TYPE "CredentialStatusListPurpose" AS ENUM (
  'revocation', 'suspension'
);

CREATE TYPE "WalletActivationStatus" AS ENUM (
  'not_activated', 'provisional', 'active', 'suspended', 'archived'
);

CREATE TYPE "WalletKeyPurpose" AS ENUM (
  'authentication', 'presentation_signing', 'key_agreement', 'recovery_wrap'
);

CREATE TYPE "WalletKeyBinding" AS ENUM (
  'platform_kms', 'device_secure_element', 'hardware_key',
  'external_wallet_reference'
);

CREATE TYPE "WalletRecoveryMethod" AS ENUM (
  'none', 'operator_assisted', 'guardian_shard', 'hardware_recovery_kit',
  'offline_paper_kit'
);

CREATE TYPE "WalletRecoveryStatus" AS ENUM (
  'requested', 'awaiting_verification', 'approved', 'denied', 'completed',
  'cancelled'
);

CREATE TYPE "WalletDeviceTrust" AS ENUM (
  'unknown', 'observed', 'trusted', 'suspended', 'revoked'
);

CREATE TYPE "ExternalFederationEntityKind" AS ENUM (
  'issuer', 'verifier', 'app', 'peer_platform', 'government_gateway'
);

CREATE TYPE "ExternalFederationEntityStatus" AS ENUM (
  'proposed', 'approved', 'suspended', 'revoked'
);

CREATE TYPE "EmergencyAccessStatus" AS ENUM (
  'requested', 'reviewing', 'approved', 'denied', 'auto_expired', 'revoked'
);

CREATE TYPE "EmergencyAccessScope" AS ENUM (
  'contact_only', 'accessibility_only', 'medical_instruction_only',
  'service_history_only', 'full_break_glass'
);

CREATE TYPE "PortabilityJobStatus" AS ENUM (
  'queued', 'running', 'completed', 'failed', 'cancelled'
);

CREATE TYPE "PortabilityDataScope" AS ENUM (
  'vault_only', 'vault_and_receipts', 'vault_and_credentials',
  'full_portable_bundle'
);

CREATE TYPE "DisclosureDecision" AS ENUM (
  'allowed', 'minimised', 'denied', 'requires_participant_review'
);

-- ============================================================================
-- Bridge: ConsentRecord.directiveId
-- ============================================================================

ALTER TABLE "ConsentRecord" ADD COLUMN "directiveId" TEXT;
CREATE INDEX "ConsentRecord_directiveId_idx" ON "ConsentRecord"("directiveId");

-- ============================================================================
-- Tables
-- ============================================================================

CREATE TABLE "ParticipantAccessVault" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "activatedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'draft',
  "privacyModeDefault" TEXT NOT NULL DEFAULT 'minimum_necessary',
  "externalIssuanceOptIn" BOOLEAN NOT NULL DEFAULT false,
  "recoveryPolicyVersion" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ParticipantAccessVault_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ParticipantAccessVault_participantId_key" ON "ParticipantAccessVault"("participantId");
CREATE INDEX "ParticipantAccessVault_status_idx" ON "ParticipantAccessVault"("status");

CREATE TABLE "ParticipantDataPackage" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "vaultId" TEXT,
  "key" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "classification" TEXT NOT NULL DEFAULT 'participant_confidential',
  "contentHash" TEXT,
  "contentSummary" JSONB,
  "sourceSystem" TEXT,
  "lastRefreshedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ParticipantDataPackage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ParticipantDataPackage_participantId_key_key" ON "ParticipantDataPackage"("participantId", "key");
CREATE INDEX "ParticipantDataPackage_participantId_category_idx" ON "ParticipantDataPackage"("participantId", "category");

CREATE TABLE "PortableClaim" (
  "id" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "asserterId" TEXT,
  "packageId" TEXT,
  "category" "PortableClaimCategory" NOT NULL,
  "provenance" "PortableClaimProvenance" NOT NULL,
  "statement" TEXT NOT NULL,
  "functionalContext" TEXT,
  "verificationRef" TEXT,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveUntil" TIMESTAMP(3),
  "supersededById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortableClaim_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PortableClaim_subjectId_category_idx" ON "PortableClaim"("subjectId", "category");
CREATE INDEX "PortableClaim_provenance_idx" ON "PortableClaim"("provenance");

CREATE TABLE "ConsentDirective" (
  "id" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "subjectId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "recipientCategory" "ConsentRecipientCategory" NOT NULL,
  "recipientOrganisationId" TEXT,
  "recipientEntityId" TEXT,
  "purpose" "ConsentPurpose" NOT NULL,
  "purposeDetail" TEXT NOT NULL,
  "scopeKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "frequency" "ConsentFrequency" NOT NULL,
  "decision" "ConsentDirectiveDecision" NOT NULL DEFAULT 'active',
  "status" "ConsentDirectiveStatus" NOT NULL DEFAULT 'active',
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveUntil" TIMESTAMP(3),
  "supersedesId" TEXT,
  "withdrawnById" TEXT,
  "withdrawnAt" TIMESTAMP(3),
  "proofBundle" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConsentDirective_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ConsentDirective_subjectId_status_decision_idx" ON "ConsentDirective"("subjectId", "status", "decision");
CREATE INDEX "ConsentDirective_recipientOrganisationId_status_idx" ON "ConsentDirective"("recipientOrganisationId", "status");
CREATE INDEX "ConsentDirective_purpose_idx" ON "ConsentDirective"("purpose");

CREATE TABLE "ConsentReceipt" (
  "id" TEXT NOT NULL,
  "directiveId" TEXT NOT NULL,
  "issuedToId" TEXT NOT NULL,
  "receiptHash" TEXT NOT NULL,
  "previousHash" TEXT,
  "humanSummary" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "contents" JSONB NOT NULL,
  CONSTRAINT "ConsentReceipt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ConsentReceipt_receiptHash_key" ON "ConsentReceipt"("receiptHash");
CREATE INDEX "ConsentReceipt_directiveId_idx" ON "ConsentReceipt"("directiveId");
CREATE INDEX "ConsentReceipt_issuedToId_issuedAt_idx" ON "ConsentReceipt"("issuedToId", "issuedAt");

CREATE TABLE "ConsentUseEvent" (
  "id" TEXT NOT NULL,
  "directiveId" TEXT NOT NULL,
  "actorId" TEXT,
  "actorLabel" TEXT,
  "purpose" "ConsentPurpose" NOT NULL,
  "action" TEXT NOT NULL,
  "outcome" TEXT NOT NULL DEFAULT 'allowed',
  "minimisation" JSONB,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsentUseEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ConsentUseEvent_directiveId_createdAt_idx" ON "ConsentUseEvent"("directiveId", "createdAt");
CREATE INDEX "ConsentUseEvent_purpose_outcome_idx" ON "ConsentUseEvent"("purpose", "outcome");

CREATE TABLE "DelegateAuthority" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "delegateId" TEXT NOT NULL,
  "relationshipKind" "DelegateRelationshipKind" NOT NULL,
  "authorityCategories" "DelegateAuthorityCategory"[] DEFAULT ARRAY[]::"DelegateAuthorityCategory"[],
  "scopedOrganisationId" TEXT,
  "verification" "DelegateAuthorityVerification" NOT NULL DEFAULT 'self_asserted',
  "status" "DelegateAuthorityStatus" NOT NULL DEFAULT 'proposed',
  "effectiveFrom" TIMESTAMP(3),
  "effectiveUntil" TIMESTAMP(3),
  "legalInstrumentRef" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DelegateAuthority_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DelegateAuthority_participant_delegate_kind_key" ON "DelegateAuthority"("participantId", "delegateId", "relationshipKind");
CREATE INDEX "DelegateAuthority_status_idx" ON "DelegateAuthority"("status");
CREATE INDEX "DelegateAuthority_verification_idx" ON "DelegateAuthority"("verification");

CREATE TABLE "DelegateAuthorityTransaction" (
  "id" TEXT NOT NULL,
  "authorityId" TEXT NOT NULL,
  "actorId" TEXT,
  "transactionKind" TEXT NOT NULL,
  "fromStatus" "DelegateAuthorityStatus",
  "toStatus" "DelegateAuthorityStatus" NOT NULL,
  "reason" TEXT,
  "evidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DelegateAuthorityTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DelegateAuthorityTransaction_authorityId_createdAt_idx" ON "DelegateAuthorityTransaction"("authorityId", "createdAt");

CREATE TABLE "CredentialTrustRegistryEntry" (
  "id" TEXT NOT NULL,
  "entityKey" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "organisationId" TEXT,
  "entityKind" "ExternalFederationEntityKind" NOT NULL,
  "trustLevel" "CredentialTrustLevel" NOT NULL DEFAULT 'observed',
  "status" "CredentialTrustStatus" NOT NULL DEFAULT 'proposed',
  "didOrPublicKey" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CredentialTrustRegistryEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CredentialTrustRegistryEntry_entityKey_key" ON "CredentialTrustRegistryEntry"("entityKey");
CREATE INDEX "CredentialTrustRegistryEntry_status_trustLevel_idx" ON "CredentialTrustRegistryEntry"("status", "trustLevel");
CREATE INDEX "CredentialTrustRegistryEntry_entityKind_idx" ON "CredentialTrustRegistryEntry"("entityKind");

CREATE TABLE "CredentialSchemaDefinition" (
  "id" TEXT NOT NULL,
  "schemaKey" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "kind" "CredentialSchemaKind" NOT NULL,
  "version" TEXT NOT NULL,
  "authorId" TEXT,
  "isGovernment" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "attributeShape" JSONB NOT NULL,
  "proofRules" JSONB,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CredentialSchemaDefinition_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CredentialSchemaDefinition_schemaKey_key" ON "CredentialSchemaDefinition"("schemaKey");
CREATE INDEX "CredentialSchemaDefinition_kind_isActive_idx" ON "CredentialSchemaDefinition"("kind", "isActive");

CREATE TABLE "IssuedCredential" (
  "id" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "schemaId" TEXT NOT NULL,
  "issuerOrganisationId" TEXT,
  "externalIssuerId" TEXT,
  "credentialSubject" JSONB NOT NULL,
  "claimHash" TEXT,
  "proofType" TEXT,
  "proofValue" JSONB,
  "simulator" BOOLEAN NOT NULL DEFAULT true,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveUntil" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "statusListId" TEXT,
  "statusListIndex" INTEGER,
  "offerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IssuedCredential_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "IssuedCredential_subjectId_revokedAt_idx" ON "IssuedCredential"("subjectId", "revokedAt");
CREATE INDEX "IssuedCredential_schemaId_idx" ON "IssuedCredential"("schemaId");
CREATE INDEX "IssuedCredential_simulator_idx" ON "IssuedCredential"("simulator");

CREATE TABLE "CredentialIssuanceOffer" (
  "id" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "schemaId" TEXT NOT NULL,
  "issuerOrganisationId" TEXT,
  "mode" "CredentialIssuanceMode" NOT NULL DEFAULT 'simulator_only',
  "status" "CredentialIssuanceStatus" NOT NULL DEFAULT 'offered',
  "purposeSummary" TEXT NOT NULL,
  "offeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "payload" JSONB,
  "humanReviewer" TEXT,
  CONSTRAINT "CredentialIssuanceOffer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CredentialIssuanceOffer_subjectId_status_idx" ON "CredentialIssuanceOffer"("subjectId", "status");
CREATE INDEX "CredentialIssuanceOffer_issuerOrganisationId_status_idx" ON "CredentialIssuanceOffer"("issuerOrganisationId", "status");

CREATE TABLE "CredentialPresentationRequest" (
  "id" TEXT NOT NULL,
  "verifierOrganisationId" TEXT,
  "externalVerifierId" TEXT,
  "purposeSummary" TEXT NOT NULL,
  "requestedClaims" JSONB NOT NULL,
  "challenge" TEXT NOT NULL,
  "status" "CredentialPresentationStatus" NOT NULL DEFAULT 'requested',
  "simulator" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "CredentialPresentationRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CredentialPresentationRequest_verifierOrganisationId_status_idx" ON "CredentialPresentationRequest"("verifierOrganisationId", "status");
CREATE INDEX "CredentialPresentationRequest_externalVerifierId_status_idx" ON "CredentialPresentationRequest"("externalVerifierId", "status");

CREATE TABLE "CredentialPresentation" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "credentialId" TEXT,
  "disclosureManifestId" TEXT,
  "status" "CredentialPresentationStatus" NOT NULL DEFAULT 'requested',
  "disclosedClaims" JSONB,
  "simulator" BOOLEAN NOT NULL DEFAULT true,
  "presentedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CredentialPresentation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CredentialPresentation_disclosureManifestId_key" ON "CredentialPresentation"("disclosureManifestId");
CREATE INDEX "CredentialPresentation_subjectId_createdAt_idx" ON "CredentialPresentation"("subjectId", "createdAt");
CREATE INDEX "CredentialPresentation_requestId_status_idx" ON "CredentialPresentation"("requestId", "status");

CREATE TABLE "CredentialStatusList" (
  "id" TEXT NOT NULL,
  "listKey" TEXT NOT NULL,
  "purpose" "CredentialStatusListPurpose" NOT NULL DEFAULT 'revocation',
  "size" INTEGER NOT NULL DEFAULT 131072,
  "encodedList" TEXT NOT NULL,
  "privateOnly" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CredentialStatusList_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CredentialStatusList_listKey_key" ON "CredentialStatusList"("listKey");
CREATE INDEX "CredentialStatusList_purpose_idx" ON "CredentialStatusList"("purpose");

CREATE TABLE "WalletRecoveryPolicy" (
  "id" TEXT NOT NULL,
  "method" "WalletRecoveryMethod" NOT NULL,
  "quorum" INTEGER NOT NULL DEFAULT 1,
  "guardianReferences" JSONB,
  "operatorAssistAllowed" BOOLEAN NOT NULL DEFAULT false,
  "offlineKitDeliveryRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WalletRecoveryPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParticipantWallet" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "activationStatus" "WalletActivationStatus" NOT NULL DEFAULT 'not_activated',
  "activationConfirmedAt" TIMESTAMP(3),
  "recoveryPolicyId" TEXT,
  "labels" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ParticipantWallet_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ParticipantWallet_participantId_key" ON "ParticipantWallet"("participantId");
CREATE UNIQUE INDEX "ParticipantWallet_recoveryPolicyId_key" ON "ParticipantWallet"("recoveryPolicyId");
CREATE INDEX "ParticipantWallet_activationStatus_idx" ON "ParticipantWallet"("activationStatus");

CREATE TABLE "WalletKeyReference" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "purpose" "WalletKeyPurpose" NOT NULL,
  "binding" "WalletKeyBinding" NOT NULL,
  "keyRef" TEXT NOT NULL,
  "algorithm" TEXT NOT NULL,
  "publicKeyJwk" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "WalletKeyReference_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WalletKeyReference_walletId_purpose_idx" ON "WalletKeyReference"("walletId", "purpose");
CREATE INDEX "WalletKeyReference_binding_idx" ON "WalletKeyReference"("binding");

CREATE TABLE "WalletRecoveryEvent" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "actorId" TEXT,
  "method" "WalletRecoveryMethod" NOT NULL,
  "status" "WalletRecoveryStatus" NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "reason" TEXT,
  "evidence" JSONB,
  CONSTRAINT "WalletRecoveryEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WalletRecoveryEvent_walletId_status_idx" ON "WalletRecoveryEvent"("walletId", "status");

CREATE TABLE "WalletDevice" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "deviceLabel" TEXT NOT NULL,
  "platform" TEXT,
  "trust" "WalletDeviceTrust" NOT NULL DEFAULT 'observed',
  "fingerprintHash" TEXT NOT NULL,
  "attestation" JSONB,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "WalletDevice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WalletDevice_walletId_fingerprintHash_key" ON "WalletDevice"("walletId", "fingerprintHash");
CREATE INDEX "WalletDevice_trust_idx" ON "WalletDevice"("trust");

CREATE TABLE "ExternalFederationEntity" (
  "id" TEXT NOT NULL,
  "entityKey" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "kind" "ExternalFederationEntityKind" NOT NULL,
  "status" "ExternalFederationEntityStatus" NOT NULL DEFAULT 'proposed',
  "ownerOrganisationId" TEXT,
  "metadataEndpoint" TEXT,
  "publicKeyJwks" JSONB,
  "didDocument" JSONB,
  "contactEmail" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalFederationEntity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExternalFederationEntity_entityKey_key" ON "ExternalFederationEntity"("entityKey");
CREATE INDEX "ExternalFederationEntity_kind_status_idx" ON "ExternalFederationEntity"("kind", "status");

CREATE TABLE "DisclosureManifest" (
  "id" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "recipientOrganisationId" TEXT,
  "recipientEntityKey" TEXT,
  "purposeSummary" TEXT NOT NULL,
  "decision" "DisclosureDecision" NOT NULL DEFAULT 'minimised',
  "requestedFields" JSONB NOT NULL,
  "minimisedFields" JSONB NOT NULL,
  "redactedFields" JSONB,
  "directiveId" TEXT,
  "receiptId" TEXT,
  "simulator" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DisclosureManifest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DisclosureManifest_subjectId_createdAt_idx" ON "DisclosureManifest"("subjectId", "createdAt");
CREATE INDEX "DisclosureManifest_recipientOrganisationId_decision_idx" ON "DisclosureManifest"("recipientOrganisationId", "decision");

CREATE TABLE "PairwiseSubjectIdentifier" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "pairwiseSub" TEXT NOT NULL,
  "algorithm" TEXT NOT NULL DEFAULT 'HMAC-SHA-256',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PairwiseSubjectIdentifier_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PairwiseSubjectIdentifier_pairwiseSub_key" ON "PairwiseSubjectIdentifier"("pairwiseSub");
CREATE UNIQUE INDEX "PairwiseSubjectIdentifier_participantId_entityId_key" ON "PairwiseSubjectIdentifier"("participantId", "entityId");
CREATE INDEX "PairwiseSubjectIdentifier_entityId_idx" ON "PairwiseSubjectIdentifier"("entityId");

CREATE TABLE "EmergencyAccessRequest" (
  "id" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "reviewerId" TEXT,
  "scope" "EmergencyAccessScope" NOT NULL,
  "status" "EmergencyAccessStatus" NOT NULL DEFAULT 'requested',
  "claimedContext" TEXT NOT NULL,
  "evidence" JSONB,
  "approvedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmergencyAccessRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmergencyAccessRequest_subjectId_status_idx" ON "EmergencyAccessRequest"("subjectId", "status");
CREATE INDEX "EmergencyAccessRequest_requesterId_status_idx" ON "EmergencyAccessRequest"("requesterId", "status");

CREATE TABLE "PortabilityExportJob" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "status" "PortabilityJobStatus" NOT NULL DEFAULT 'queued',
  "scope" "PortabilityDataScope" NOT NULL DEFAULT 'vault_only',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "artifactRef" TEXT,
  "humanSummary" TEXT,
  "errors" JSONB,
  CONSTRAINT "PortabilityExportJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PortabilityExportJob_participantId_status_idx" ON "PortabilityExportJob"("participantId", "status");

CREATE TABLE "PortabilityImportJob" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "status" "PortabilityJobStatus" NOT NULL DEFAULT 'queued',
  "sourceLabel" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "conflicts" JSONB,
  "humanSummary" TEXT,
  "errors" JSONB,
  CONSTRAINT "PortabilityImportJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PortabilityImportJob_participantId_status_idx" ON "PortabilityImportJob"("participantId", "status");

-- ============================================================================
-- Foreign keys
-- ============================================================================

ALTER TABLE "ConsentRecord"
  ADD CONSTRAINT "ConsentRecord_directiveId_fkey"
  FOREIGN KEY ("directiveId") REFERENCES "ConsentDirective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ParticipantAccessVault"
  ADD CONSTRAINT "ParticipantAccessVault_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParticipantDataPackage"
  ADD CONSTRAINT "ParticipantDataPackage_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParticipantDataPackage"
  ADD CONSTRAINT "ParticipantDataPackage_vaultId_fkey"
  FOREIGN KEY ("vaultId") REFERENCES "ParticipantAccessVault"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PortableClaim"
  ADD CONSTRAINT "PortableClaim_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortableClaim"
  ADD CONSTRAINT "PortableClaim_asserterId_fkey"
  FOREIGN KEY ("asserterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PortableClaim"
  ADD CONSTRAINT "PortableClaim_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "ParticipantDataPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PortableClaim"
  ADD CONSTRAINT "PortableClaim_supersededById_fkey"
  FOREIGN KEY ("supersededById") REFERENCES "PortableClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ConsentDirective"
  ADD CONSTRAINT "ConsentDirective_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentDirective"
  ADD CONSTRAINT "ConsentDirective_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConsentDirective"
  ADD CONSTRAINT "ConsentDirective_recipientOrganisationId_fkey"
  FOREIGN KEY ("recipientOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConsentDirective"
  ADD CONSTRAINT "ConsentDirective_supersedesId_fkey"
  FOREIGN KEY ("supersedesId") REFERENCES "ConsentDirective"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConsentDirective"
  ADD CONSTRAINT "ConsentDirective_withdrawnById_fkey"
  FOREIGN KEY ("withdrawnById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ConsentReceipt"
  ADD CONSTRAINT "ConsentReceipt_directiveId_fkey"
  FOREIGN KEY ("directiveId") REFERENCES "ConsentDirective"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentReceipt"
  ADD CONSTRAINT "ConsentReceipt_issuedToId_fkey"
  FOREIGN KEY ("issuedToId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConsentUseEvent"
  ADD CONSTRAINT "ConsentUseEvent_directiveId_fkey"
  FOREIGN KEY ("directiveId") REFERENCES "ConsentDirective"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentUseEvent"
  ADD CONSTRAINT "ConsentUseEvent_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DelegateAuthority"
  ADD CONSTRAINT "DelegateAuthority_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DelegateAuthority"
  ADD CONSTRAINT "DelegateAuthority_delegateId_fkey"
  FOREIGN KEY ("delegateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DelegateAuthority"
  ADD CONSTRAINT "DelegateAuthority_scopedOrganisationId_fkey"
  FOREIGN KEY ("scopedOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DelegateAuthorityTransaction"
  ADD CONSTRAINT "DelegateAuthorityTransaction_authorityId_fkey"
  FOREIGN KEY ("authorityId") REFERENCES "DelegateAuthority"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DelegateAuthorityTransaction"
  ADD CONSTRAINT "DelegateAuthorityTransaction_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CredentialTrustRegistryEntry"
  ADD CONSTRAINT "CredentialTrustRegistryEntry_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CredentialTrustRegistryEntry"
  ADD CONSTRAINT "CredentialTrustRegistryEntry_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CredentialSchemaDefinition"
  ADD CONSTRAINT "CredentialSchemaDefinition_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "IssuedCredential"
  ADD CONSTRAINT "IssuedCredential_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IssuedCredential"
  ADD CONSTRAINT "IssuedCredential_schemaId_fkey"
  FOREIGN KEY ("schemaId") REFERENCES "CredentialSchemaDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IssuedCredential"
  ADD CONSTRAINT "IssuedCredential_issuerOrganisationId_fkey"
  FOREIGN KEY ("issuerOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IssuedCredential"
  ADD CONSTRAINT "IssuedCredential_externalIssuerId_fkey"
  FOREIGN KEY ("externalIssuerId") REFERENCES "ExternalFederationEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IssuedCredential"
  ADD CONSTRAINT "IssuedCredential_statusListId_fkey"
  FOREIGN KEY ("statusListId") REFERENCES "CredentialStatusList"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IssuedCredential"
  ADD CONSTRAINT "IssuedCredential_offerId_fkey"
  FOREIGN KEY ("offerId") REFERENCES "CredentialIssuanceOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CredentialIssuanceOffer"
  ADD CONSTRAINT "CredentialIssuanceOffer_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CredentialIssuanceOffer"
  ADD CONSTRAINT "CredentialIssuanceOffer_schemaId_fkey"
  FOREIGN KEY ("schemaId") REFERENCES "CredentialSchemaDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CredentialIssuanceOffer"
  ADD CONSTRAINT "CredentialIssuanceOffer_issuerOrganisationId_fkey"
  FOREIGN KEY ("issuerOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CredentialPresentationRequest"
  ADD CONSTRAINT "CredentialPresentationRequest_verifierOrganisationId_fkey"
  FOREIGN KEY ("verifierOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CredentialPresentationRequest"
  ADD CONSTRAINT "CredentialPresentationRequest_externalVerifierId_fkey"
  FOREIGN KEY ("externalVerifierId") REFERENCES "ExternalFederationEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CredentialPresentation"
  ADD CONSTRAINT "CredentialPresentation_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "CredentialPresentationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CredentialPresentation"
  ADD CONSTRAINT "CredentialPresentation_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CredentialPresentation"
  ADD CONSTRAINT "CredentialPresentation_credentialId_fkey"
  FOREIGN KEY ("credentialId") REFERENCES "IssuedCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CredentialPresentation"
  ADD CONSTRAINT "CredentialPresentation_disclosureManifestId_fkey"
  FOREIGN KEY ("disclosureManifestId") REFERENCES "DisclosureManifest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ParticipantWallet"
  ADD CONSTRAINT "ParticipantWallet_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParticipantWallet"
  ADD CONSTRAINT "ParticipantWallet_recoveryPolicyId_fkey"
  FOREIGN KEY ("recoveryPolicyId") REFERENCES "WalletRecoveryPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WalletKeyReference"
  ADD CONSTRAINT "WalletKeyReference_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "ParticipantWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WalletRecoveryEvent"
  ADD CONSTRAINT "WalletRecoveryEvent_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "ParticipantWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalletRecoveryEvent"
  ADD CONSTRAINT "WalletRecoveryEvent_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WalletDevice"
  ADD CONSTRAINT "WalletDevice_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "ParticipantWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExternalFederationEntity"
  ADD CONSTRAINT "ExternalFederationEntity_ownerOrganisationId_fkey"
  FOREIGN KEY ("ownerOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DisclosureManifest"
  ADD CONSTRAINT "DisclosureManifest_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DisclosureManifest"
  ADD CONSTRAINT "DisclosureManifest_recipientOrganisationId_fkey"
  FOREIGN KEY ("recipientOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PairwiseSubjectIdentifier"
  ADD CONSTRAINT "PairwiseSubjectIdentifier_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PairwiseSubjectIdentifier"
  ADD CONSTRAINT "PairwiseSubjectIdentifier_entityId_fkey"
  FOREIGN KEY ("entityId") REFERENCES "ExternalFederationEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmergencyAccessRequest"
  ADD CONSTRAINT "EmergencyAccessRequest_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyAccessRequest"
  ADD CONSTRAINT "EmergencyAccessRequest_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmergencyAccessRequest"
  ADD CONSTRAINT "EmergencyAccessRequest_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PortabilityExportJob"
  ADD CONSTRAINT "PortabilityExportJob_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortabilityImportJob"
  ADD CONSTRAINT "PortabilityImportJob_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
