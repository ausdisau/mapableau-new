import { z } from "zod";

import { PROVIDER_SERVICE_IDS } from "./search-service-catalog";

export const PROVIDER_FUNCTIONAL_REQUIREMENTS = [
  { id: "step_free", label: "Step-free premises" },
  { id: "quiet_environment", label: "Quiet or low-sensory setting" },
  { id: "assistance_animal", label: "Assistance animal access" },
  { id: "wheelchair_transport", label: "Wheelchair-accessible transport" },
  { id: "personal_care", label: "Personal care assistance" },
  { id: "mealtime_support", label: "Mealtime assistance" },
] as const;

/** Stored only with informed opt-in. Not a medical or NDIS eligibility profile. */
export const PROVIDER_SEARCH_CONSENT_VERSION = "provider-search-personalisation-v1";
export const providerSearchPreferencesSchema = z.object({
  state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]).optional(),
  postcode: z.string().regex(/^\d{4}$/).optional(),
  suburb: z.string().trim().min(2).max(50).regex(/^[a-zA-Z \-'’.]+$/).optional(),
  serviceTypes: z.array(z.enum(PROVIDER_SERVICE_IDS)).max(5).default([]),
  functionalRequirements: z.array(z.enum(PROVIDER_FUNCTIONAL_REQUIREMENTS.map((item) => item.id) as ["step_free", ...string[]])).max(6).default([]),
  communicationModes: z.array(z.enum(["AAC", "Text", "Auslan"])).max(3).default([]),
  delivery: z.enum(["any", "home_visit", "in_person", "telehealth"]).default("any"),
  fundingManagement: z.enum(["unspecified", "ndia", "plan", "self"]).default("unspecified"),
}).strict();
export type ProviderSearchPreferences = z.infer<typeof providerSearchPreferencesSchema>;

export const saveProviderSearchProfileSchema = z.object({
  consent: z.literal(true),
  consentVersion: z.literal(PROVIDER_SEARCH_CONSENT_VERSION),
  preferences: providerSearchPreferencesSchema,
}).strict();

export type SavedProviderSearchProfile = {
  preferences: ProviderSearchPreferences;
  consentVersion: string;
  consentGrantedAt: string;
  updatedAt: string;
};

/** Off until Prisma migration, privacy review, and production security gates pass. */
export function isProviderSearchProfileEnabled() {
  return process.env.MAPABLE_PROVIDER_SEARCH_PROFILE_ENABLED === "true";
}
