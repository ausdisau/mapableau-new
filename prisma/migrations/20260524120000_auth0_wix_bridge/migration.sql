-- Auth0 / Wix identity bridge

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('not_started', 'role_selection', 'in_progress', 'completed', 'pending_verification');

-- AlterTable: passwordHash optional for Auth0-only users
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "auth_identity_links" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "auth0UserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "auth_identity_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_bridge_events" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "provider" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_bridge_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_onboarding_status" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "selectedRole" TEXT,
    "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'not_started',
    "completedSteps" JSONB NOT NULL DEFAULT '[]',
    "nextStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_onboarding_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wix_member_links" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "auth0UserId" TEXT NOT NULL,
    "wixMemberId" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'linked',
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "wix_member_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_identity_links_auth0UserId_key" ON "auth_identity_links"("auth0UserId");

-- CreateIndex
CREATE INDEX "auth_identity_links_profileId_idx" ON "auth_identity_links"("profileId");

-- CreateIndex
CREATE INDEX "auth_identity_links_email_idx" ON "auth_identity_links"("email");

-- CreateIndex
CREATE INDEX "auth_bridge_events_profileId_createdAt_idx" ON "auth_bridge_events"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "auth_bridge_events_eventType_createdAt_idx" ON "auth_bridge_events"("eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "profile_onboarding_status_profileId_key" ON "profile_onboarding_status"("profileId");

-- CreateIndex
CREATE INDEX "profile_onboarding_status_profileId_idx" ON "profile_onboarding_status"("profileId");

-- CreateIndex
CREATE INDEX "wix_member_links_profileId_idx" ON "wix_member_links"("profileId");

-- CreateIndex
CREATE INDEX "wix_member_links_wixMemberId_idx" ON "wix_member_links"("wixMemberId");

-- CreateIndex
CREATE INDEX "wix_member_links_auth0UserId_idx" ON "wix_member_links"("auth0UserId");

-- AddForeignKey
ALTER TABLE "auth_identity_links" ADD CONSTRAINT "auth_identity_links_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_bridge_events" ADD CONSTRAINT "auth_bridge_events_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_onboarding_status" ADD CONSTRAINT "profile_onboarding_status_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wix_member_links" ADD CONSTRAINT "wix_member_links_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
