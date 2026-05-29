-- CreateEnum
CREATE TYPE "WorkerInvitationStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- CreateTable
CREATE TABLE "WorkerProviderInvitation" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "WorkerInvitationStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "workerProfileId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerProviderInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProviderInvitation_tokenHash_key" ON "WorkerProviderInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "WorkerProviderInvitation_providerId_status_idx" ON "WorkerProviderInvitation"("providerId", "status");

-- CreateIndex
CREATE INDEX "WorkerProviderInvitation_email_status_idx" ON "WorkerProviderInvitation"("email", "status");

-- AddForeignKey
ALTER TABLE "WorkerProviderInvitation" ADD CONSTRAINT "WorkerProviderInvitation_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProviderInvitation" ADD CONSTRAINT "WorkerProviderInvitation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProviderInvitation" ADD CONSTRAINT "WorkerProviderInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProviderInvitation" ADD CONSTRAINT "WorkerProviderInvitation_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
