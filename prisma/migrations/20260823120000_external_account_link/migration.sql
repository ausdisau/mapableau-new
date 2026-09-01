-- External account link metadata for Alexa (and future providers).
-- Stores subject hashes only — never OAuth access/refresh tokens or secrets.

CREATE TABLE IF NOT EXISTS "external_account_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalSubjectHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LINKED',
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_account_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "external_account_links_provider_externalSubjectHash_key"
  ON "external_account_links"("provider", "externalSubjectHash");

CREATE INDEX IF NOT EXISTS "external_account_links_userId_provider_idx"
  ON "external_account_links"("userId", "provider");

DO $$ BEGIN
  ALTER TABLE "external_account_links"
    ADD CONSTRAINT "external_account_links_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
