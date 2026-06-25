import { z } from "zod";

export const INTEREST_FORM_TYPES = [
  "early_access",
  "provider",
  "transport_partner",
  "employer",
  "venue_partner",
] as const;

export type InterestFormType = (typeof INTEREST_FORM_TYPES)[number];

export const interestFormTypeLabels: Record<InterestFormType, string> = {
  early_access: "Participant or carer early access",
  provider: "Provider interest",
  transport_partner: "Transport partner interest",
  employer: "Employer or inclusive jobs partner",
  venue_partner: "Council or venue accessibility partner",
};

export const interestFormSchema = z.object({
  formType: z.enum(INTEREST_FORM_TYPES),
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  roleOrOrganisation: z.string().trim().min(2, "Tell us your role or organisation").max(200),
  location: z.string().trim().min(2, "Enter suburb or postcode").max(120),
  accessNeedsOrInterest: z.string().trim().max(2000).optional().or(z.literal("")),
  message: z.string().trim().max(5000).optional().or(z.literal("")),
  consent: z
    .boolean()
    .refine((value) => value === true, "You must agree before we can contact you"),
  company: z.string().max(0).optional(),
});

export type InterestFormInput = z.infer<typeof interestFormSchema>;
