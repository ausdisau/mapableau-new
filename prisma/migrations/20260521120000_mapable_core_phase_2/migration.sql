-- MapAble Core Phase 2 — see prisma/schema.prisma for full model definitions.
-- Run: npx prisma migrate deploy

-- Enums and tables created by Prisma migrate; this file documents Phase 2 deployment.
-- For fresh installs, `prisma db push` or `migrate dev` from schema is authoritative.

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "providerResponseStatus" "ProviderResponseStatus" NOT NULL DEFAULT 'not_sent';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "providerResponseNote" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "providerRespondedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "fundingSourceId" TEXT;
