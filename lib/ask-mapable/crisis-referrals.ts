import type { CopilotAction } from "@/lib/copilot/types";

export type AustralianJurisdiction =
  | "ACT"
  | "NSW"
  | "NT"
  | "QLD"
  | "SA"
  | "TAS"
  | "VIC"
  | "WA";

export type CrisisReferral = {
  id: string;
  name: string;
  description: string;
  audience: string;
  availability: string;
  phone?: string;
  text?: string;
  href: string;
  channels: Array<"phone" | "text" | "chat" | "video" | "relay" | "in_person">;
  urgency: "emergency" | "crisis" | "clinical_triage" | "support";
  jurisdiction?: AustralianJurisdiction;
  officialSource: string;
};

export type CrisisReferralPlan = {
  referral: CrisisReferral;
  mode: "present_only" | "user_initiated" | "human_assisted";
  consentRequiredBeforeSharing: true;
  externalAcceptanceConfirmed: false;
  notes: string[];
};

/**
 * Current Australian crisis pathways. Keep this directory provenance-led and
 * review against official sources on a scheduled basis. MapAble may present a
 * route; it must not claim the service accepted a referral until the external
 * service confirms that itself.
 */
export const NATIONAL_CRISIS_REFERRALS: CrisisReferral[] = [
  {
    id: "triple-zero",
    name: "Triple Zero (000)",
    description:
      "Emergency police, fire or ambulance response when life is in danger or there is immediate risk of serious harm.",
    audience: "Anyone in Australia in an emergency",
    availability: "24/7",
    phone: "000",
    href: "tel:000",
    channels: ["phone", "relay"],
    urgency: "emergency",
    officialSource: "https://www.healthdirect.gov.au/mental-health-crisis-support",
  },
  {
    id: "lifeline",
    name: "Lifeline",
    description:
      "Confidential crisis support with trained crisis supporters by phone, text or online chat.",
    audience: "Anyone needing crisis support",
    availability: "24/7",
    phone: "13 11 14",
    text: "0477 13 11 14",
    href: "https://www.lifeline.org.au/get-help/",
    channels: ["phone", "text", "chat", "relay"],
    urgency: "crisis",
    officialSource: "https://www.lifeline.org.au/get-help/",
  },
  {
    id: "suicide-callback-service",
    name: "Suicide Call Back Service",
    description:
      "Free professional counselling for people feeling suicidal, worried about someone, caring for someone at risk, or bereaved by suicide.",
    audience: "People in Australia aged 15 and over affected by suicide",
    availability: "24/7",
    phone: "1300 659 467",
    href: "https://www.suicidecallbackservice.org.au/",
    channels: ["phone", "chat", "video", "relay"],
    urgency: "crisis",
    officialSource: "https://www.suicidecallbackservice.org.au/",
  },
  {
    id: "beyond-blue",
    name: "Beyond Blue Support Service",
    description:
      "Brief counselling and support for anxiety, depression, distress and mental health concerns.",
    audience: "People in Australia seeking mental health support",
    availability: "24/7",
    phone: "1300 22 4636",
    href: "https://www.beyondblue.org.au/get-support",
    channels: ["phone", "chat", "relay"],
    urgency: "support",
    officialSource: "https://www.beyondblue.org.au/",
  },
  {
    id: "13yarn",
    name: "13YARN",
    description:
      "Culturally safe crisis support with Aboriginal and Torres Strait Islander Crisis Supporters.",
    audience: "Aboriginal and Torres Strait Islander people",
    availability: "24/7",
    phone: "13 92 76",
    href: "https://www.13yarn.org.au/",
    channels: ["phone", "relay"],
    urgency: "crisis",
    officialSource: "https://www.13yarn.org.au/",
  },
  {
    id: "kids-helpline",
    name: "Kids Helpline",
    description:
      "Free counselling for children and young people by phone and webchat.",
    audience: "Children and young people",
    availability: "24/7",
    phone: "1800 55 1800",
    href: "https://www.kidshelpline.com.au/",
    channels: ["phone", "chat", "relay"],
    urgency: "support",
    officialSource: "https://www.kidshelpline.com.au/",
  },
  {
    id: "mensline",
    name: "MensLine Australia",
    description:
      "Professional counselling for men about mental health, relationships, stress, family violence and suicidal thoughts.",
    audience: "Men in Australia",
    availability: "24/7",
    phone: "1300 78 99 78",
    href: "https://mensline.org.au/",
    channels: ["phone", "chat", "video", "relay"],
    urgency: "support",
    officialSource: "https://mensline.org.au/",
  },
  {
    id: "qlife",
    name: "QLife",
    description:
      "Anonymous LGBTIQA+ peer support and referrals by phone and webchat.",
    audience: "LGBTIQA+ people and people wanting to talk about sexuality or gender",
    availability: "3 pm to 9 pm daily, local time",
    phone: "1800 184 527",
    href: "https://www.qlife.org.au/",
    channels: ["phone", "chat", "relay"],
    urgency: "support",
    officialSource: "https://www.qlife.org.au/",
  },
  {
    id: "nrs",
    name: "National Relay Service",
    description:
      "Relay pathways for people who are d/Deaf, hard of hearing or have difficulty using speech. Emergency NRS calls receive priority.",
    audience: "People who use relay communication",
    availability: "24/7 for core relay services",
    text: "0423 677 767",
    href: "https://www.accesshub.gov.au/about-the-nrs/how-to-make-an-emergency-call-using-the-nrs",
    channels: ["text", "chat", "relay"],
    urgency: "emergency",
    officialSource:
      "https://www.accesshub.gov.au/about-the-nrs/how-to-make-an-emergency-call-using-the-nrs",
  },
];

export const STATE_MENTAL_HEALTH_TRIAGE: CrisisReferral[] = [
  {
    id: "nsw-mental-health-line",
    name: "NSW Mental Health Line",
    description:
      "NSW Health mental health advice, brief assessment and referral to appropriate NSW Health mental health services.",
    audience: "People in New South Wales",
    availability: "24/7",
    phone: "1800 011 511",
    href: "tel:1800011511",
    channels: ["phone", "relay"],
    urgency: "clinical_triage",
    jurisdiction: "NSW",
    officialSource: "https://www.health.nsw.gov.au/mentalhealth/pages/mental-health-line.aspx",
  },
  {
    id: "qld-mental-health-call",
    name: "1300 MH CALL",
    description: "Queensland public mental health access and triage line.",
    audience: "People in Queensland",
    availability: "24/7",
    phone: "1300 642 255",
    href: "tel:1300642255",
    channels: ["phone", "relay"],
    urgency: "clinical_triage",
    jurisdiction: "QLD",
    officialSource: "https://www.healthdirect.gov.au/australian-mental-health-services",
  },
  {
    id: "sa-mental-health-triage",
    name: "SA Mental Health Triage Service",
    description: "South Australian public mental health triage service.",
    audience: "People in South Australia",
    availability: "24/7",
    phone: "13 14 65",
    href: "tel:131465",
    channels: ["phone", "relay"],
    urgency: "clinical_triage",
    jurisdiction: "SA",
    officialSource: "https://www.healthdirect.gov.au/australian-mental-health-services",
  },
  {
    id: "tas-mental-health-services-helpline",
    name: "Tasmania Mental Health Services Helpline",
    description: "Tasmanian public mental health crisis and service access line.",
    audience: "People in Tasmania",
    availability: "24/7",
    phone: "1800 332 388",
    href: "tel:1800332388",
    channels: ["phone", "relay"],
    urgency: "clinical_triage",
    jurisdiction: "TAS",
    officialSource: "https://www.healthdirect.gov.au/australian-mental-health-services",
  },
  {
    id: "nt-mental-health-line",
    name: "NT Mental Health Line",
    description: "Northern Territory public mental health crisis and service access line.",
    audience: "People in the Northern Territory",
    availability: "24/7",
    phone: "1800 682 288",
    href: "tel:1800682288",
    channels: ["phone", "relay"],
    urgency: "clinical_triage",
    jurisdiction: "NT",
    officialSource: "https://www.healthdirect.gov.au/australian-mental-health-services",
  },
  {
    id: "act-access-mental-health",
    name: "ACT Access Mental Health",
    description: "ACT public mental health assessment and referral line.",
    audience: "People in the Australian Capital Territory",
    availability: "24/7",
    phone: "1800 629 354",
    href: "tel:1800629354",
    channels: ["phone", "relay"],
    urgency: "clinical_triage",
    jurisdiction: "ACT",
    officialSource: "https://www.healthdirect.gov.au/australian-mental-health-services",
  },
  {
    id: "wa-mental-health-emergency-metro",
    name: "WA Mental Health Emergency Response Line — Metro",
    description: "Mental health emergency response for metropolitan Perth.",
    audience: "People in metropolitan Perth",
    availability: "24/7",
    phone: "1300 555 788",
    href: "tel:1300555788",
    channels: ["phone", "relay"],
    urgency: "clinical_triage",
    jurisdiction: "WA",
    officialSource: "https://www.healthdirect.gov.au/australian-mental-health-services",
  },
  {
    id: "wa-mental-health-emergency-peel",
    name: "WA Mental Health Emergency Response Line — Peel",
    description: "Mental health emergency response for the Peel region.",
    audience: "People in the Peel region of Western Australia",
    availability: "24/7",
    phone: "1800 676 822",
    href: "tel:1800676822",
    channels: ["phone", "relay"],
    urgency: "clinical_triage",
    jurisdiction: "WA",
    officialSource: "https://www.healthdirect.gov.au/australian-mental-health-services",
  },
  {
    id: "vic-suicideline",
    name: "SuicideLine Victoria",
    description:
      "Free 24/7 professional phone and online counselling for Victorians at risk of suicide, affected by suicide, or experiencing mental health concerns.",
    audience: "People in Victoria",
    availability: "24/7",
    phone: "1300 651 251",
    href: "tel:1300651251",
    channels: ["phone", "chat", "video", "relay"],
    urgency: "crisis",
    jurisdiction: "VIC",
    officialSource: "https://www.health.vic.gov.au/mental-health-services/telephone-and-online-services",
  },
];

export function crisisReferralsForJurisdiction(
  jurisdiction?: AustralianJurisdiction,
): CrisisReferral[] {
  if (!jurisdiction) return [...NATIONAL_CRISIS_REFERRALS];
  return [
    ...NATIONAL_CRISIS_REFERRALS,
    ...STATE_MENTAL_HEALTH_TRIAGE.filter(
      (referral) => referral.jurisdiction === jurisdiction,
    ),
  ];
}

/**
 * Plan a warm route without pretending MapAble has transferred care.
 * External crisis services generally expose human phone/text/chat entry points,
 * not a MapAble referral API. Any sharing of participant details therefore
 * remains an explicit, purpose-bound user or human-assisted step.
 */
export function planCrisisReferral(
  referral: CrisisReferral,
  mode: CrisisReferralPlan["mode"] = "present_only",
): CrisisReferralPlan {
  return {
    referral,
    mode,
    consentRequiredBeforeSharing: true,
    externalAcceptanceConfirmed: false,
    notes: [
      "MapAble may present or open this verified pathway.",
      "MapAble must not claim the external service accepted a referral unless that service confirms it.",
      "Do not share conversation content, disability information, location or contacts without a separate lawful basis and purpose-bound consent, except where an authorised emergency process applies.",
    ],
  };
}

export function highPriorityCrisisActions(): CopilotAction[] {
  return [
    {
      type: "SAFETY_ESCALATION",
      label: "Call 000 if you may act now",
      requiresConfirmation: false,
      href: "tel:000",
    },
    {
      type: "GUIDANCE_ONLY",
      label: "Lifeline — call, text or chat",
      requiresConfirmation: false,
      href: "/help/crisis#lifeline",
    },
    {
      type: "GUIDANCE_ONLY",
      label: "Suicide Call Back Service",
      requiresConfirmation: false,
      href: "/help/crisis#suicide-callback-service",
    },
    {
      type: "GUIDANCE_ONLY",
      label: "Accessible crisis contact options",
      requiresConfirmation: false,
      href: "/help/crisis#accessible-contact",
    },
    {
      type: "GUIDANCE_ONLY",
      label: "State/territory crisis support",
      requiresConfirmation: false,
      href: "/help/crisis#state-triage",
    },
  ];
}

export function nonImmediateCrisisActions(): CopilotAction[] {
  return [
    {
      type: "GUIDANCE_ONLY",
      label: "Lifeline — call, text or chat",
      requiresConfirmation: false,
      href: "/help/crisis#lifeline",
    },
    {
      type: "GUIDANCE_ONLY",
      label: "Suicide-specific counselling",
      requiresConfirmation: false,
      href: "/help/crisis#suicide-callback-service",
    },
    {
      type: "SAFETY_ESCALATION",
      label: "Talk to a MapAble person",
      requiresConfirmation: false,
      href: "/contact",
    },
    {
      type: "GUIDANCE_ONLY",
      label: "More crisis support options",
      requiresConfirmation: false,
      href: "/help/crisis",
    },
  ];
}
