-- MapAble auth governance tables (OAuth identity links, auth events, onboarding).
-- Safe to re-run: uses IF NOT EXISTS.

DO $$ BEGIN
  CREATE TYPE "ProfileOnboardingState" AS ENUM (
    'not_started', 'in_progress', 'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AuthIdentityLink" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerSubject" TEXT NOT NULL,
  "email" TEXT,
  "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  CONSTRAINT "AuthIdentityLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AuthIdentityLink_provider_providerSubject_key"
  ON "AuthIdentityLink"("provider", "providerSubject");
CREATE INDEX IF NOT EXISTS "AuthIdentityLink_userId_idx" ON "AuthIdentityLink"("userId");

DO $$ BEGIN
  ALTER TABLE "AuthIdentityLink"
    ADD CONSTRAINT "AuthIdentityLink_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AuthEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "eventType" TEXT NOT NULL,
  "provider" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuthEvent_userId_idx" ON "AuthEvent"("userId");
CREATE INDEX IF NOT EXISTS "AuthEvent_eventType_idx" ON "AuthEvent"("eventType");
CREATE INDEX IF NOT EXISTS "AuthEvent_createdAt_idx" ON "AuthEvent"("createdAt");

DO $$ BEGIN
  ALTER TABLE "AuthEvent"
    ADD CONSTRAINT "AuthEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ProfileOnboardingStatus" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "ProfileOnboardingState" NOT NULL DEFAULT 'not_started',
  "currentStep" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfileOnboardingStatus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProfileOnboardingStatus_userId_key"
  ON "ProfileOnboardingStatus"("userId");

DO $$ BEGIN
  ALTER TABLE "ProfileOnboardingStatus"
    ADD CONSTRAINT "ProfileOnboardingStatus_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
