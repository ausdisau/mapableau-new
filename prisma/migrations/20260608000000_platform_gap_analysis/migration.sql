-- Platform gap analysis — manual override storage for admin dashboard

CREATE TYPE "PlatformGapResolutionStatus" AS ENUM (
  'open',
  'in_progress',
  'mitigated',
  'accepted_risk',
  'closed'
);

CREATE TABLE "PlatformGapOverride" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "status" "PlatformGapResolutionStatus" NOT NULL DEFAULT 'open',
  "notes" TEXT,
  "updatedById" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformGapOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformGapOverride_code_key" ON "PlatformGapOverride"("code");
