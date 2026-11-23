import { z } from "zod";

import { mobilityRequirementsSchema } from "@/lib/transport/mobility-schema";

export const bookingScope = {
  kerbsideNote: "transport.kerbside_note",
  mobilitySummary: "transport.mobility_summary",
  ndisLineItemTag: "transport.ndis_line_item_tag",
} as const;

export const bookingConsentScopesSchema = z
  .array(z.enum(bookingScope))
  .max(Object.keys(bookingScope).length)
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "Select each scope only once."
  );

// A provider grant covers functional flags only. Free text and pooling consent stay private.
const functionalSummary = mobilityRequirementsSchema.pick({
  requiresWheelchairAccessible: true,
  canTransferFromWheelchair: true,
  requiresRamp: true,
  requiresHoist: true,
  requiresLift: true,
  requiresAccessEquipment: true,
  assistanceAnimalPresent: true,
  driverAssistanceRequired: true,
  needsDriverAssistanceToDoor: true,
  needsExtraBoardingTime: true,
});

export function providerMobilitySummary(
  scopes: readonly string[],
  requirements: unknown
) {
  if (!scopes.includes(bookingScope.mobilitySummary)) return {};
  const result = functionalSummary.safeParse(requirements);
  return result.success ? result.data : {};
}

// Aggregate APIs without a recipient-specific trip view must not serialise private fields.
export const omitTripSharingFields = {
  accessNotes: true,
  mobilityRequirements: true,
  consentScopes: true,
} as const;
