-- MapAble Emergency MVP
CREATE TYPE "EvacuationPlanType" AS ENUM ('home', 'work', 'other');

-- CreateEnum
CREATE TYPE "EmergencyCheckInStatus" AS ENUM ('safe', 'need_help');

-- CreateEnum
CREATE TYPE "DisasterAlertSeverity" AS ENUM ('info', 'watch', 'warning', 'emergency');

-- CreateEnum
CREATE TYPE "EmergencyTransportRequestStatus" AS ENUM ('draft', 'requested', 'completed', 'cancelled');

CREATE TABLE "EmergencyProfile" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "mobilitySummary" TEXT,
    "communicationNeeds" TEXT,
    "supportNeedsSummary" TEXT,
    "defaultPickupAddress" TEXT,
    "nomineeCanManage" BOOLEAN NOT NULL DEFAULT false,
    "sharedWithCoordinator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "profileId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "relationship" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnNeedHelp" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvacuationPlan" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "planType" "EvacuationPlanType" NOT NULL DEFAULT 'home',
    "title" TEXT NOT NULL,
    "meetingPoint" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvacuationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvacuationPlanStep" (
    "id" TEXT NOT NULL,
    "evacuationPlanId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "instruction" TEXT NOT NULL,
    "estimatedMinutes" INTEGER,

    CONSTRAINT "EvacuationPlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriticalAccessNote" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriticalAccessNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyTransportRequest" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "EmergencyTransportRequestStatus" NOT NULL DEFAULT 'requested',
    "pickupAddress" TEXT NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "urgencyNotes" TEXT,
    "bookingId" TEXT,
    "transportBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyTransportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyCheckIn" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "EmergencyCheckInStatus" NOT NULL,
    "message" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisasterAlert" (
    "id" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" "DisasterAlertSeverity" NOT NULL DEFAULT 'info',
    "source" TEXT NOT NULL DEFAULT 'mapable_admin',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisasterAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisasterAlertSubscription" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "alertId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisasterAlertSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmergencyProfile_participantId_key" ON "EmergencyProfile"("participantId");

-- CreateIndex
CREATE INDEX "EmergencyContact_participantId_idx" ON "EmergencyContact"("participantId");

-- CreateIndex
CREATE INDEX "EvacuationPlan_participantId_idx" ON "EvacuationPlan"("participantId");

-- CreateIndex
CREATE INDEX "EvacuationPlanStep_evacuationPlanId_sortOrder_idx" ON "EvacuationPlanStep"("evacuationPlanId", "sortOrder");

-- CreateIndex
CREATE INDEX "CriticalAccessNote_participantId_idx" ON "CriticalAccessNote"("participantId");

-- CreateIndex
CREATE INDEX "EmergencyTransportRequest_participantId_status_idx" ON "EmergencyTransportRequest"("participantId", "status");

-- CreateIndex
CREATE INDEX "EmergencyCheckIn_participantId_createdAt_idx" ON "EmergencyCheckIn"("participantId", "createdAt");

-- CreateIndex
CREATE INDEX "DisasterAlert_regionCode_active_idx" ON "DisasterAlert"("regionCode", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DisasterAlertSubscription_participantId_regionCode_key" ON "DisasterAlertSubscription"("participantId", "regionCode");

ALTER TABLE "EmergencyProfile" ADD CONSTRAINT "EmergencyProfile_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "EmergencyProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvacuationPlan" ADD CONSTRAINT "EvacuationPlan_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvacuationPlanStep" ADD CONSTRAINT "EvacuationPlanStep_evacuationPlanId_fkey" FOREIGN KEY ("evacuationPlanId") REFERENCES "EvacuationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriticalAccessNote" ADD CONSTRAINT "CriticalAccessNote_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyTransportRequest" ADD CONSTRAINT "EmergencyTransportRequest_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyTransportRequest" ADD CONSTRAINT "EmergencyTransportRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyCheckIn" ADD CONSTRAINT "EmergencyCheckIn_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisasterAlertSubscription" ADD CONSTRAINT "DisasterAlertSubscription_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisasterAlertSubscription" ADD CONSTRAINT "DisasterAlertSubscription_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "DisasterAlert"("id") ON DELETE SET NULL ON UPDATE CASCADE;
