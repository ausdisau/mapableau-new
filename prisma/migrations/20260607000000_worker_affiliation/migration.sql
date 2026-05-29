-- CreateEnum
CREATE TYPE "WorkerAffiliationStatus" AS ENUM ('pending', 'active', 'suspended', 'ended');

-- AlterTable
ALTER TABLE "WorkerProfile" ADD COLUMN "affiliationStatus" "WorkerAffiliationStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "WorkerProfile" ADD COLUMN "affiliatedAt" TIMESTAMP(3);
ALTER TABLE "WorkerProfile" ADD COLUMN "endedAt" TIMESTAMP(3);
ALTER TABLE "WorkerProfile" ADD COLUMN "invitedByUserId" TEXT;
ALTER TABLE "WorkerProfile" ADD COLUMN "acceptedAt" TIMESTAMP(3);

-- Backfill affiliatedAt for existing profiles
UPDATE "WorkerProfile" SET "affiliatedAt" = "createdAt" WHERE "affiliatedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "WorkerProfile_organisationId_affiliationStatus_idx" ON "WorkerProfile"("organisationId", "affiliationStatus");
