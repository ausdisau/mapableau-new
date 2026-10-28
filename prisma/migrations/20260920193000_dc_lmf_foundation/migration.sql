-- DC-LMF: disability-centric person context and correction/provenance ledger.
-- Default-off feature; does not replace ConsentRecord, ParticipantAuthorityGrant,
-- ParticipantAccessReceipt or AuditEvent.

CREATE TABLE "dclmf_memory_records" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "payloadJson" JSONB,
    "payloadRef" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceRef" TEXT,
    "confidence" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "dataClass" TEXT NOT NULL,
    "purposeTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "observedAt" TIMESTAMP(3),
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "supersedesId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "contestReason" TEXT,
    "consentRecordId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dclmf_memory_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "dclmf_memory_records_participantId_status_category_idx"
    ON "dclmf_memory_records"("participantId", "status", "category");
CREATE INDEX "dclmf_memory_records_participantId_createdAt_idx"
    ON "dclmf_memory_records"("participantId", "createdAt");
CREATE INDEX "dclmf_memory_records_supersedesId_idx"
    ON "dclmf_memory_records"("supersedesId");
CREATE INDEX "dclmf_memory_records_consentRecordId_idx"
    ON "dclmf_memory_records"("consentRecordId");

ALTER TABLE "dclmf_memory_records"
    ADD CONSTRAINT "dclmf_memory_records_participantId_fkey"
    FOREIGN KEY ("participantId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dclmf_memory_records"
    ADD CONSTRAINT "dclmf_memory_records_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dclmf_memory_records"
    ADD CONSTRAINT "dclmf_memory_records_supersedesId_fkey"
    FOREIGN KEY ("supersedesId") REFERENCES "dclmf_memory_records"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
