-- Apply only after Neon branch rehearsal, security review and explicit release approval.
-- No provider, worker, diagnosis or chat transcript is stored in this table.
CREATE TABLE "provider_search_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "consentGrantedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_search_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "provider_search_profiles_userId_key" ON "provider_search_profiles"("userId");
ALTER TABLE "provider_search_profiles"
  ADD CONSTRAINT "provider_search_profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
