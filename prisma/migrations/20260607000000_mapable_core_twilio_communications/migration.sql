-- AlterEnum
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'voice';
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'whatsapp';

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('sms', 'voice', 'whatsapp', 'email', 'in_app');
CREATE TYPE "CommunicationConsentStatus" AS ENUM ('opted_in', 'opted_out', 'pending', 'revoked');
CREATE TYPE "MessageDeliveryStatus" AS ENUM ('queued', 'sent', 'delivered', 'failed', 'undelivered', 'read', 'received');
CREATE TYPE "NotificationTemplateKey" AS ENUM ('booking_confirmed', 'booking_reminder_24h', 'booking_reminder_2h', 'transport_driver_assigned', 'transport_arriving', 'trip_completed', 'invoice_issued', 'invoice_overdue', 'support_message_received', 'urgent_provider_alert');
CREATE TYPE "PhoneVerificationStatus" AS ENUM ('pending', 'approved', 'failed', 'expired', 'canceled');

-- CreateTable
CREATE TABLE "CommunicationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "consentStatus" "CommunicationConsentStatus" NOT NULL DEFAULT 'pending',
    "phoneNumberE164" TEXT,
    "notificationType" TEXT NOT NULL DEFAULT 'all',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "accessibleCommunicationMode" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateKey" "NotificationTemplateKey" NOT NULL,
    "channel" "CommunicationChannel",
    "status" TEXT NOT NULL DEFAULT 'pending',
    "bookingId" TEXT,
    "tripId" TEXT,
    "invoiceId" TEXT,
    "metadata" JSONB,
    "scheduledFor" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutboundMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationEventId" TEXT,
    "channel" "CommunicationChannel" NOT NULL,
    "templateKey" "NotificationTemplateKey",
    "messageBodyRedacted" TEXT NOT NULL,
    "phoneNumberE164" TEXT,
    "twilioSid" TEXT,
    "deliveryStatus" "MessageDeliveryStatus" NOT NULL DEFAULT 'queued',
    "bookingId" TEXT,
    "tripId" TEXT,
    "invoiceId" TEXT,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InboundMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "channel" "CommunicationChannel" NOT NULL,
    "fromNumberE164" TEXT NOT NULL,
    "messageBodyRedacted" TEXT NOT NULL,
    "command" TEXT,
    "twilioSid" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboundMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhoneVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumberE164" TEXT NOT NULL,
    "status" "PhoneVerificationStatus" NOT NULL DEFAULT 'pending',
    "twilioSid" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneVerification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TwilioWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "twilioSid" TEXT,
    "payloadHash" TEXT NOT NULL,
    "payloadMeta" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TwilioWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationPreference_userId_channel_notificationType_key" ON "CommunicationPreference"("userId", "channel", "notificationType");
CREATE INDEX "CommunicationPreference_userId_idx" ON "CommunicationPreference"("userId");

CREATE INDEX "NotificationEvent_userId_templateKey_idx" ON "NotificationEvent"("userId", "templateKey");
CREATE INDEX "NotificationEvent_status_scheduledFor_idx" ON "NotificationEvent"("status", "scheduledFor");
CREATE INDEX "NotificationEvent_bookingId_idx" ON "NotificationEvent"("bookingId");

CREATE INDEX "OutboundMessage_userId_createdAt_idx" ON "OutboundMessage"("userId", "createdAt");
CREATE INDEX "OutboundMessage_twilioSid_idx" ON "OutboundMessage"("twilioSid");
CREATE INDEX "OutboundMessage_deliveryStatus_idx" ON "OutboundMessage"("deliveryStatus");

CREATE INDEX "InboundMessage_fromNumberE164_idx" ON "InboundMessage"("fromNumberE164");
CREATE INDEX "InboundMessage_userId_createdAt_idx" ON "InboundMessage"("userId", "createdAt");

CREATE INDEX "PhoneVerification_userId_phoneNumberE164_idx" ON "PhoneVerification"("userId", "phoneNumberE164");
CREATE INDEX "PhoneVerification_status_idx" ON "PhoneVerification"("status");

CREATE INDEX "TwilioWebhookEvent_twilioSid_idx" ON "TwilioWebhookEvent"("twilioSid");
CREATE INDEX "TwilioWebhookEvent_payloadHash_idx" ON "TwilioWebhookEvent"("payloadHash");
CREATE INDEX "TwilioWebhookEvent_createdAt_idx" ON "TwilioWebhookEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "CommunicationPreference" ADD CONSTRAINT "CommunicationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutboundMessage" ADD CONSTRAINT "OutboundMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutboundMessage" ADD CONSTRAINT "OutboundMessage_notificationEventId_fkey" FOREIGN KEY ("notificationEventId") REFERENCES "NotificationEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InboundMessage" ADD CONSTRAINT "InboundMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PhoneVerification" ADD CONSTRAINT "PhoneVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
