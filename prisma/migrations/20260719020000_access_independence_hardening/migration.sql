-- Access Independence hardening: tenant-scoped barriers + one-time magic links

-- AlterTable
ALTER TABLE "AccessBarrierReport" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "AccessBarrierReport" ADD COLUMN IF NOT EXISTS "triageNotes" TEXT;
ALTER TABLE "AccessBarrierReport" ADD COLUMN IF NOT EXISTS "statusHistory" JSONB;
ALTER TABLE "AccessBarrierReport" ALTER COLUMN "description" SET DEFAULT '';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AccessBarrierReport_organisationId_status_idx" ON "AccessBarrierReport"("organisationId", "status");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AccessBarrierReport_organisationId_fkey'
  ) THEN
    ALTER TABLE "AccessBarrierReport"
      ADD CONSTRAINT "AccessBarrierReport_organisationId_fkey"
      FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "MagicLinkToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'credentials-magic-link',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MagicLinkToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MagicLinkToken_tokenHash_key" ON "MagicLinkToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "MagicLinkToken_userId_purpose_idx" ON "MagicLinkToken"("userId", "purpose");
CREATE INDEX IF NOT EXISTS "MagicLinkToken_expiresAt_idx" ON "MagicLinkToken"("expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MagicLinkToken_userId_fkey'
  ) THEN
    ALTER TABLE "MagicLinkToken"
      ADD CONSTRAINT "MagicLinkToken_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
