export type StepDownReferralCategory =
  | "clinical_navigation"
  | "mental_health_navigation"
  | "violence_abuse_support";

export type StepDownReferral = {
  id: string;
  name: string;
  description: string;
  availability: string;
  phone?: string;
  text?: string;
  href: string;
  category: StepDownReferralCategory;
  isCrisisService: false;
  externalAcceptanceConfirmed: false;
  officialSource: string;
  verifiedAt: "2026-09-10";
};

export const MENTAL_HEALTH_STEP_DOWN_REFERRALS: StepDownReferral[] = [
  {
    id: "healthdirect",
    name: "healthdirect",
    description:
      "Speak with a registered nurse about a health concern and get advice about what care to seek. This is not emergency dispatch.",
    availability: "24/7",
    phone: "1800 022 222",
    href: "https://www.healthdirect.gov.au/contact-us",
    category: "clinical_navigation",
    isCrisisService: false,
    externalAcceptanceConfirmed: false,
    officialSource: "https://www.healthdirect.gov.au/contact-us",
    verifiedAt: "2026-09-10",
  },
  {
    id: "medicare-mental-health",
    name: "Medicare Mental Health",
    description:
      "Free mental health advice, assessment and referral to local services. Medicare Mental Health explicitly states that this phone service is not a crisis service.",
    availability: "Monday to Friday, 8:30 am to 5:00 pm, excluding public holidays",
    phone: "1800 595 212",
    href: "https://www.medicarementalhealth.gov.au/service/national-phone-service-17838",
    category: "mental_health_navigation",
    isCrisisService: false,
    externalAcceptanceConfirmed: false,
    officialSource:
      "https://www.medicarementalhealth.gov.au/service/national-phone-service-17838",
    verifiedAt: "2026-09-10",
  },
];

const SPECIALISED_SAFEGUARDING_REFERRALS: StepDownReferral[] = [
  {
    id: "1800respect",
    name: "1800RESPECT",
    description:
      "National domestic, family and sexual violence counselling, information and support service.",
    availability: "24/7",
    phone: "1800 737 732",
    text: "0458 737 732",
    href: "https://www.1800respect.org.au/",
    category: "violence_abuse_support",
    isCrisisService: false,
    externalAcceptanceConfirmed: false,
    officialSource: "https://www.1800respect.org.au/FAQ",
    verifiedAt: "2026-09-10",
  },
];

/**
 * Specialised safeguarding pathways are kept separate so MapAble can offer
 * them when relevant without inferring abuse from unrelated distress.
 */
export function specialisedSafeguardingReferrals(): StepDownReferral[] {
  return [...SPECIALISED_SAFEGUARDING_REFERRALS];
}
