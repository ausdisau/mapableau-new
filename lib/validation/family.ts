import { z } from "zod";

export const inviteNomineeSchema = z.object({
  nomineeEmail: z.string().email(),
  nomineeName: z.string().min(1),
  relationship: z.string().optional(),
  scopes: z.array(z.enum([
    "view_dashboard",
    "view_bookings",
    "create_booking_draft",
    "approve_invoice",
    "view_documents",
    "message_providers",
    "view_emergency_profile",
    "manage_notifications",
    "view_service_history",
    "support_plan_review",
  ])).min(1),
});

export const updatePermissionsSchema = z.object({
  scopes: z.array(z.enum([
    "view_dashboard",
    "view_bookings",
    "create_booking_draft",
    "approve_invoice",
    "view_documents",
    "message_providers",
    "view_emergency_profile",
    "manage_notifications",
    "view_service_history",
    "support_plan_review",
  ])),
});

export const bookingDraftSchema = z.object({
  participantId: z.string().min(1),
  bookingType: z.enum(["care", "transport", "care_transport"]),
  requestedStart: z.string().datetime(),
  notes: z.string().optional(),
});

export const approveInvoiceSchema = z.object({
  participantId: z.string().min(1),
  linkId: z.string().min(1),
});
