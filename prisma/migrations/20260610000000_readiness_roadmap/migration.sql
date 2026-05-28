-- Launch readiness notes + organisation-scoped billing link (when BillingAccount exists)

ALTER TABLE "LaunchReadinessItem" ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "Organisation" ADD COLUMN IF NOT EXISTS "billingAccountId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Organisation_billingAccountId_key"
  ON "Organisation"("billingAccountId");

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'BillingAccount'
  ) THEN
    ALTER TABLE "Organisation"
      ADD CONSTRAINT "Organisation_billingAccountId_fkey"
      FOREIGN KEY ("billingAccountId") REFERENCES "BillingAccount"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
