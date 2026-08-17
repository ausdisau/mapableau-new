-- Optional Document → StoredAsset link for flag-gated ObjectStore writes.
-- Local-disk Document.fileKey behaviour is unchanged.

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "storedAssetId" TEXT;

CREATE INDEX IF NOT EXISTS "Document_storedAssetId_idx" ON "Document"("storedAssetId");

DO $$ BEGIN
  ALTER TABLE "Document" ADD CONSTRAINT "Document_storedAssetId_fkey"
    FOREIGN KEY ("storedAssetId") REFERENCES "stored_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
