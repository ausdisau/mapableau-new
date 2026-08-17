-- Participant Information Vault join table. Bytes remain on Document / StoredAsset.

DO $$ BEGIN
  CREATE TYPE "ParticipantVaultItemKind" AS ENUM (
    'identity',
    'plan',
    'agreement',
    'note',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "participant_vault_items" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "kind" "ParticipantVaultItemKind" NOT NULL,
    "label" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participant_vault_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "participant_vault_items_participantId_documentId_key"
  ON "participant_vault_items"("participantId", "documentId");

CREATE INDEX IF NOT EXISTS "participant_vault_items_participantId_createdAt_idx"
  ON "participant_vault_items"("participantId", "createdAt");

CREATE INDEX IF NOT EXISTS "participant_vault_items_documentId_idx"
  ON "participant_vault_items"("documentId");

CREATE INDEX IF NOT EXISTS "participant_vault_items_createdById_idx"
  ON "participant_vault_items"("createdById");

DO $$ BEGIN
  ALTER TABLE "participant_vault_items" ADD CONSTRAINT "participant_vault_items_participantId_fkey"
    FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "participant_vault_items" ADD CONSTRAINT "participant_vault_items_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "participant_vault_items" ADD CONSTRAINT "participant_vault_items_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
