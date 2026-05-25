import { z } from "zod";

export const threadTypeSchema = z.enum([
  "direct",
  "group",
  "booking",
  "transport_trip",
  "invoice",
  "service_agreement",
  "support_ticket",
  "complaint",
  "incident_safe_comms",
  "telehealth",
  "provider_team",
  "admin_support",
]);

export const messageTypeSchema = z.enum([
  "text",
  "attachment",
  "image",
  "voice_note",
  "system_event",
  "booking_card",
  "invoice_card",
  "service_agreement_card",
  "telehealth_link",
  "support_ticket_update",
  "incident_safety_update",
]);

export const messageReportReasonSchema = z.enum([
  "abusive_or_harassing",
  "unsafe_support",
  "billing_issue",
  "privacy_concern",
  "discrimination",
  "worker_no_show",
  "inappropriate_contact",
  "other",
]);

export const createThreadSchema = z.object({
  threadType: threadTypeSchema,
  title: z.string().min(1).max(200),
  participantProfileIds: z.array(z.string()).optional(),
  participantId: z.string().optional(),
  providerId: z.string().optional(),
  bookingId: z.string().optional(),
  transportTripId: z.string().optional(),
  invoiceId: z.string().optional(),
  serviceAgreementId: z.string().optional(),
  supportTicketId: z.string().optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(10000),
  messageType: messageTypeSchema.optional().default("text"),
  attachmentDocumentIds: z.array(z.string()).optional(),
  metadataJson: z.record(z.string(), z.unknown()).optional(),
});

export const reportThreadSchema = z.object({
  messageId: z.string().optional(),
  reason: messageReportReasonSchema,
  details: z.string().max(5000).optional(),
});

export const blockUserSchema = z.object({
  blockedProfileId: z.string().min(1),
});

export const addParticipantsSchema = z.object({
  participants: z.array(
    z.object({
      profileId: z.string(),
      role: z.string(),
      displayName: z.string(),
      canSend: z.boolean().optional(),
      canAttachFiles: z.boolean().optional(),
    })
  ),
});

export const escalateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10000).optional(),
});
