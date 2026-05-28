-- Repair: LaunchReadinessItem was in schema but missing from some databases.

DO $$ BEGIN
  CREATE TYPE "LaunchReadinessStatus" AS ENUM (
    'not_started',
    'in_progress',
    'blocked',
    'ready',
    'waived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "LaunchReadinessItem" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "LaunchReadinessStatus" NOT NULL DEFAULT 'not_started',
  "evidenceDocumentId" TEXT,
  "completedAt" TIMESTAMP(3),
  "completedById" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LaunchReadinessItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LaunchReadinessItem_code_key"
  ON "LaunchReadinessItem"("code");
