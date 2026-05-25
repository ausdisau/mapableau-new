import { z } from "zod";

import { REGISTRATION_ROLES } from "@/types/registration";

const auStates = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
] as const;

export const baseRegistrationSchema = z.object({
  role: z.enum(REGISTRATION_ROLES),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().max(254),
  mobile: z.string().min(8).max(20),
  country: z.enum(["AU", "NZ"]),
  stateOrTerritory: z.enum(auStates),
  postcode: z.string().min(3).max(10),
  preferredCommunicationMethod: z.enum([
    "plain_language",
    "email",
    "sms",
    "phone",
  ]),
  accessibilityCommunicationPreference: z.string().max(500).optional(),
  acceptedTerms: z.literal(true, {
    error: "You must accept the terms of use",
  }),
  acceptedPrivacyPolicy: z.literal(true, {
    error: "You must accept the privacy policy",
  }),
  marketingConsent: z.boolean().optional().default(false),
});

export const roleSelectionSchema = z.object({
  role: z.enum(REGISTRATION_ROLES),
});

export const accountCreateSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type BaseRegistrationInput = z.infer<typeof baseRegistrationSchema>;
export type RoleSelectionInput = z.infer<typeof roleSelectionSchema>;
