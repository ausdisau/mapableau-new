import type { ConsentScope as PrismaConsentScope } from "@prisma/client";

import type { ConsentScope } from "@/types/mapable";

const TO_PRISMA: Record<ConsentScope, PrismaConsentScope> = {
  "profile.read": "profile_read",
  "accessibility.read": "accessibility_read",
  "booking.read": "booking_read",
  "booking.manage": "booking_manage",
  "messages.send": "messages_send",
  "billing.read": "billing_read",
  "support_coordination.access": "support_coordination_access",
  "plan_manager.invoice_access": "plan_manager_invoice_access",
  "transport.accessibility_share": "transport_accessibility_share",
  "care.accessibility_share": "care_accessibility_share",
  "foods.dietary_share": "foods_dietary_share",
  "foods.allergy_share": "foods_allergy_share",
  "foods.delivery_address_share": "foods_delivery_address_share",
  "foods.invoice_share": "foods_invoice_share",
  "foods.delivery_photo_share": "foods_delivery_photo_share",
  "peer.activity.read": "peer_activity_read",
};

const FROM_PRISMA: Record<PrismaConsentScope, ConsentScope> = Object.fromEntries(
  Object.entries(TO_PRISMA).map(([k, v]) => [v, k as ConsentScope])
) as Record<PrismaConsentScope, ConsentScope>;

export function consentScopeToPrisma(scope: ConsentScope): PrismaConsentScope {
  return TO_PRISMA[scope];
}

export function consentScopeFromPrisma(
  scope: PrismaConsentScope
): ConsentScope {
  return FROM_PRISMA[scope];
}
