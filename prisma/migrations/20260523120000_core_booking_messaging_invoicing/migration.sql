-- MapAble Core: booking, messaging, invoicing spine

-- BookingStatus enum values
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'declined';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'invoiced';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'paid';

-- InvoiceStatus enum values
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'issued';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'awaiting_participant_approval';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'awaiting_plan_manager';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'overdue';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'disputed';

-- Booking columns
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "locationFrom" JSONB;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "locationTo" JSONB;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "accessibilityRequirements" JSONB;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "ndisSupportCategory" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "ndisLineItem" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "estimatedTotalCents" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "actualTotalCents" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "actualStartAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "actualEndAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "completionNotes" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "deliveredSupports" JSONB;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "preferredCommunicationMethod" TEXT;

CREATE INDEX IF NOT EXISTS "Booking_assignedOrganisationId_status_idx" ON "Booking"("assignedOrganisationId", "status");
CREATE INDEX IF NOT EXISTS "Booking_requestedStart_idx" ON "Booking"("requestedStart");

-- ConversationParticipant
ALTER TABLE "ConversationParticipant" ADD COLUMN IF NOT EXISTS "roleInThread" TEXT;
ALTER TABLE "ConversationParticipant" ADD COLUMN IF NOT EXISTS "lastReadAt" TIMESTAMP(3);

-- Message
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachments" JSONB;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "isSystemMessage" BOOLEAN NOT NULL DEFAULT false;

-- Notification
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "channel" TEXT NOT NULL DEFAULT 'in_app';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "notificationType" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "actionUrl" TEXT;
CREATE INDEX IF NOT EXISTS "Notification_userId_notificationType_idx" ON "Notification"("userId", "notificationType");

-- Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "issuedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "participantGapCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "ndisClaimableCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "xeroInvoiceId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber") WHERE "invoiceNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Invoice_organisationId_status_idx" ON "Invoice"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_bookingId_idx" ON "Invoice"("bookingId");

-- InvoiceLine
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "ndisSupportCategory" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "gstApplicable" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS "InvoiceLine_invoiceId_key";
