import { z } from "zod";

export const INTEREST_ROLES = [
  "participant",
  "family-carer",
  "support-coordinator",
  "provider",
  "plan-manager",
  "council-government",
  "venue-organiser",
  "employer",
  "transport-partner",
  "advocate-community",
  "investor-funder",
  "other",
] as const;

export type InterestRole = (typeof INTEREST_ROLES)[number];

export const interestRoleLabels: Record<InterestRole, string> = {
  participant: "Participant / person with disability",
  "family-carer": "Family member or carer",
  "support-coordinator": "Support coordinator",
  provider: "Provider",
  "plan-manager": "Plan manager",
  "council-government": "Council / government",
  "venue-organiser": "Venue / event organiser",
  employer: "Employer",
  "transport-partner": "Transport partner",
  "advocate-community": "Advocate / community organisation",
  "investor-funder": "Investor / funder",
  other: "Other",
};

export const interestFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  organisation: z.string().trim().max(200).optional(),
  email: z.string().trim().email("Enter a valid email address").max(254),
  phone: z.string().trim().max(30).optional(),
  role: z.enum(INTEREST_ROLES),
  interestedVerticals: z
    .array(z.string().trim().min(1).max(80))
    .min(1, "Select at least one vertical"),
  location: z.string().trim().min(2, "Enter your location or region").max(200),
  message: z
    .string()
    .trim()
    .min(10, "Please add a few more details (at least 10 characters)")
    .max(5000, "Message is too long"),
  consentContact: z
    .boolean()
    .refine((val) => val === true, { message: "You must agree to be contacted" }),
  consentTesting: z.boolean().optional(),
  /** Honeypot — must stay empty for legitimate submissions. */
  company: z.string().max(0).optional(),
});

export type InterestFormInput = z.infer<typeof interestFormSchema>;
