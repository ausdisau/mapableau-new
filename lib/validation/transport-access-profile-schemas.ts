import { z } from "zod";

const preferenceLevel = z.enum(["required", "preferred", "unknown", "not_applicable"]);

export const transportAccessProfileUpdateSchema = z.object({
  mobilityDevices: z
    .array(
      z.object({
        type: z.enum([
          "ambulatory",
          "manual_wheelchair",
          "power_wheelchair",
          "scooter",
          "walker",
          "other",
        ]),
        remainsInDevice: z.boolean().optional(),
        lengthCm: z.number().positive().optional(),
        widthCm: z.number().positive().optional(),
        heightCm: z.number().positive().optional(),
        weightKg: z.number().positive().optional(),
        level: preferenceLevel.optional(),
      })
    )
    .optional(),
  transferAbility: z.string().max(200).optional().nullable(),
  boardingMethod: z
    .object({
      ramp: preferenceLevel.optional(),
      lift: preferenceLevel.optional(),
      sideEntry: preferenceLevel.optional(),
      rearEntry: preferenceLevel.optional(),
      headroomCm: z.number().positive().optional(),
      openingWidthCm: z.number().positive().optional(),
      restraintNeeded: z.boolean().optional(),
    })
    .optional(),
  defaultAssistance: z
    .object({
      curbToCurb: z.boolean().optional(),
      doorToDoor: z.boolean().optional(),
      handOver: z.boolean().optional(),
      visualGuidance: z.boolean().optional(),
      hearingSupport: z.boolean().optional(),
      wayfindingSupport: z.boolean().optional(),
    })
    .optional(),
  communicationPrefs: z
    .object({
      speech: z.boolean().optional(),
      text: z.boolean().optional(),
      aac: z.boolean().optional(),
      auslan: z.boolean().optional(),
      preferredContact: z.enum(["phone", "sms", "app", "email"]).optional(),
    })
    .optional(),
  sensoryPrefs: z
    .object({
      quietRide: z.boolean().optional(),
      lowFragrance: z.boolean().optional(),
      conversationPreference: z.enum(["chatty", "quiet", "no_preference"]).optional(),
      notificationPreference: z.enum(["minimal", "standard", "detailed"]).optional(),
    })
    .optional(),
  companionDefaults: z
    .object({
      supportPerson: z.boolean().optional(),
      childSeatRequired: z.boolean().optional(),
      defaultCompanionCount: z.number().int().min(0).max(4).optional(),
    })
    .optional(),
  serviceAnimal: z.boolean().optional(),
  safePickupNotes: z.string().max(2000).optional().nullable(),
  restrictedDriverNotes: z.string().max(2000).optional().nullable(),
});

export type TransportAccessProfileUpdate = z.infer<
  typeof transportAccessProfileUpdateSchema
>;
