-- MapAble MFA tables. Safe to re-run.

DO $$ BEGIN
  CREATE TYPE "MfaMethodType" AS ENUM ('totp', 'email', 'sms', 'webauthn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MfaChallengeStatus" AS ENUM ('pending', 'completed', 'failed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "MfaMethod" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "MfaMethodType" NOT NULL,
  "label" TEXT,
  "secretEncrypted" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT true,
  "enabledAt" TIMESTAMP(3),
  "disabledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MfaMethod_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MfaMethod_userId_idx" ON "MfaMethod"("userId");
CREATE INDEX IF NOT EXISTS "MfaMethod_userId_type_idx" ON "MfaMethod"("userId", "type");

CREATE TABLE IF NOT EXISTS "MfaRecoveryCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MfaRecoveryCode_userId_idx" ON "MfaRecoveryCode"("userId");

CREATE TABLE IF NOT EXISTS "MfaChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "challengeType" TEXT NOT NULL,
  "action" TEXT,
  "status" "MfaChallengeStatus" NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MfaChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MfaChallenge_userId_status_idx" ON "MfaChallenge"("userId", "status");
CREATE INDEX IF NOT EXISTS "MfaChallenge_expiresAt_idx" ON "MfaChallenge"("expiresAt");

CREATE TABLE IF NOT EXISTS "AuthSecurityEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "eventType" TEXT NOT NULL,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthSecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuthSecurityEvent_userId_idx" ON "AuthSecurityEvent"("userId");
CREATE INDEX IF NOT EXISTS "AuthSecurityEvent_eventType_idx" ON "AuthSecurityEvent"("eventType");
CREATE INDEX IF NOT EXISTS "AuthSecurityEvent_createdAt_idx" ON "AuthSecurityEvent"("createdAt");

CREATE TABLE IF NOT EXISTS "TrustedDevice" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceTokenHash" TEXT NOT NULL,
  "label" TEXT,
  "lastUsedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrustedDevice_userId_deviceTokenHash_key"
  ON "TrustedDevice"("userId", "deviceTokenHash");
CREATE INDEX IF NOT EXISTS "TrustedDevice_userId_idx" ON "TrustedDevice"("userId");
