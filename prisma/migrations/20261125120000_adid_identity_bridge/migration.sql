-- Existing deployments may already have the original Keycloak bridge tables from db push.
-- Subject ownership is scoped to the exact issuing authority and protected by a unique index.
CREATE TABLE IF NOT EXISTS "IdentityProviderLink" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalSubjectId" TEXT NOT NULL,
    "externalEmail" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" JSONB
);
CREATE UNIQUE INDEX IF NOT EXISTS "IdentityProviderLink_provider_externalSubjectId_key"
    ON "IdentityProviderLink" ("provider", "externalSubjectId");
CREATE INDEX IF NOT EXISTS "IdentityProviderLink_userId_idx" ON "IdentityProviderLink" ("userId");

CREATE TABLE IF NOT EXISTS "AuthBridgeEvent" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AuthBridgeEvent_userId_createdAt_idx" ON "AuthBridgeEvent" ("userId", "createdAt");
