import { z } from "zod";

const mobilityAid = z.enum([
  "manual_wheelchair",
  "power_wheelchair",
  "mobility_scooter",
  "walker",
  "cane",
  "prosthetic",
  "assistance_animal",
  "none",
  "other",
]);

const communicationPreference = z.enum([
  "plain_language",
  "sms",
  "email",
  "phone",
  "aac",
  "auslan",
  "support_person",
  "written_only",
]);

export const accessibilityProfileSchema = z.object({
  mobilityNeeds: z.array(mobilityAid).default([]),
  communicationPreferences: z.array(communicationPreference).default([]),
  sensoryPreferences: z.record(z.string(), z.unknown()).default({}),
  cognitivePreferences: z.record(z.string(), z.unknown()).default({}),
  transportRequirements: z
    .object({
      requiresWheelchairAccessibleVehicle: z.boolean().optional(),
      canTransferFromWheelchair: z.boolean().optional(),
      requiresRamp: z.boolean().optional(),
      requiresHoist: z.boolean().optional(),
      assistanceAnimalPresent: z.boolean().optional(),
      needsDriverAssistanceToDoor: z.boolean().optional(),
      needsExtraBoardingTime: z.boolean().optional(),
      pickupNotes: z.string().max(2000).optional(),
      dropoffNotes: z.string().max(2000).optional(),
    })
    .default({}),
  digitalPreferences: z
    .object({
      largeText: z.boolean().optional(),
      highContrast: z.boolean().optional(),
      reducedMotion: z.boolean().optional(),
      screenReaderUser: z.boolean().optional(),
      voiceControlPreferred: z.boolean().optional(),
      wordPredictionEnabled: z.boolean().optional(),
      customPhrases: z.array(z.string().max(200)).max(50).optional(),
      dyslexiaFriendlyMode: z.boolean().optional(),
      simpleLanguageMode: z.boolean().optional(),
    })
    .default({}),
  shareWithProviders: z.record(z.string(), z.boolean()).default({}),
});
