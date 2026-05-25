import { z } from "zod";

const consentScope = z.enum([
  "profile.read",
  "accessibility.read",
  "booking.read",
  "booking.manage",
  "messages.send",
  "billing.read",
  "support_coordination.access",
  "plan_manager.invoice_access",
  "transport.accessibility_share",
  "care.accessibility_share",
  "foods.dietary_share",
  "foods.allergy_share",
  "foods.delivery_address_share",
  "foods.invoice_share",
  "foods.delivery_photo_share",
  "peer.activity.read",
]);

export const grantConsentSchema = z
  .object({
    grantedToUserId: z.string().optional(),
    grantedToOrganisationId: z.string().optional(),
    scope: consentScope,
    purpose: z.string().min(3).max(500),
    expiryDate: z.string().optional(),
  })
  .refine(
    (d) => d.grantedToUserId || d.grantedToOrganisationId,
    "Grant consent to a person or organisation"
  );
