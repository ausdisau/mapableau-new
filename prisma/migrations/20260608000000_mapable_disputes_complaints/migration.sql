-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('invoice_dispute', 'service_not_delivered', 'no_show', 'late_arrival', 'wrong_worker_or_driver', 'access_need_not_met', 'overcharge_concern', 'quality_concern');
CREATE TYPE "DisputeStatus" AS ENUM ('submitted', 'under_review', 'awaiting_provider_response', 'resolved', 'closed', 'withdrawn');
CREATE TYPE "ComplaintType" AS ENUM ('unsafe_service', 'privacy_concern', 'discrimination_or_disrespect', 'communication_issue', 'provider_conduct', 'worker_conduct', 'platform_issue', 'other');
CREATE TYPE "ComplaintStatus" AS ENUM ('submitted', 'under_review', 'escalated_to_incident', 'resolved', 'closed');

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "organisationId" TEXT,
    "bookingId" TEXT,
    "invoiceId" TEXT,
    "timesheetId" TEXT,
    "transportBookingId" TEXT,
    "billingInvoiceId" TEXT,
    "type" "DisputeType" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'submitted',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "desiredOutcome" TEXT,
    "resolutionSummary" TEXT,
    "assignedAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DisputeEvent" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "body" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'all',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DisputeEvidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "documentId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "organisationId" TEXT,
    "bookingId" TEXT,
    "invoiceId" TEXT,
    "timesheetId" TEXT,
    "type" "ComplaintType" NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'submitted',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "escalatedIncidentId" TEXT,
    "safetyEscalated" BOOLEAN NOT NULL DEFAULT false,
    "resolutionSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComplaintEvent" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComplaintResponse" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dispute_participantId_status_idx" ON "Dispute"("participantId", "status");
CREATE INDEX "Dispute_organisationId_status_idx" ON "Dispute"("organisationId", "status");
CREATE INDEX "Dispute_status_createdAt_idx" ON "Dispute"("status", "createdAt");

CREATE INDEX "DisputeEvent_disputeId_createdAt_idx" ON "DisputeEvent"("disputeId", "createdAt");
CREATE INDEX "DisputeEvidence_disputeId_idx" ON "DisputeEvidence"("disputeId");

CREATE INDEX "Complaint_participantId_status_idx" ON "Complaint"("participantId", "status");
CREATE INDEX "Complaint_organisationId_status_idx" ON "Complaint"("organisationId", "status");
CREATE INDEX "Complaint_status_createdAt_idx" ON "Complaint"("status", "createdAt");

CREATE INDEX "ComplaintEvent_complaintId_createdAt_idx" ON "ComplaintEvent"("complaintId", "createdAt");
CREATE INDEX "ComplaintResponse_complaintId_createdAt_idx" ON "ComplaintResponse"("complaintId", "createdAt");

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_transportBookingId_fkey" FOREIGN KEY ("transportBookingId") REFERENCES "TransportBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DisputeEvent" ADD CONSTRAINT "DisputeEvent_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DisputeEvent" ADD CONSTRAINT "DisputeEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DisputeEvidence" ADD CONSTRAINT "DisputeEvidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DisputeEvidence" ADD CONSTRAINT "DisputeEvidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ComplaintEvent" ADD CONSTRAINT "ComplaintEvent_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplaintEvent" ADD CONSTRAINT "ComplaintEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ComplaintResponse" ADD CONSTRAINT "ComplaintResponse_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplaintResponse" ADD CONSTRAINT "ComplaintResponse_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
