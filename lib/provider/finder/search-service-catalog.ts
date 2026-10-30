/** Match against names actually present in imported ndis_providers text[] columns.
 * These are directory classifications, NOT provider or worker registration verification.
 */
export const PROVIDER_SERVICE_IDS = [
  "support_coordination",
  "daily_life",
  "therapy",
  "community",
  "transport",
  "employment",
  "assistive_technology",
  "home_modifications",
  "housing",
] as const;
export type ProviderServiceId = (typeof PROVIDER_SERVICE_IDS)[number];

export const PROVIDER_SERVICE_CATALOG: Record<
  ProviderServiceId,
  { label: string; registrationGroups: string[]; serviceLabels: string[]; phrases: string[] }
> = {
  support_coordination: {
    label: "Support coordination",
    registrationGroups: ["Support Coordination"],
    serviceLabels: [],
    phrases: ["support coordination", "support coordinator", "support coordinators"],
  },
  daily_life: {
    label: "Daily life and support workers",
    registrationGroups: [
      "Daily Personal Activities",
      "High Intensity Daily Personal Activities",
      "Assistance with daily life tasks in a group or shared living arrangement",
    ],
    serviceLabels: ["Disability Support Worker (includes Mental Health or Peer Worker)"],
    phrases: ["support worker", "support workers", "personal care", "daily living", "daily life", "carer", "carers", "personal support"],
  },
  therapy: {
    label: "Therapy and allied health",
    registrationGroups: ["Therapeutic Supports"],
    serviceLabels: [
      "Occupational Therapist", "Physiotherapist", "Speech Pathologist",
      "Psychologist", "Exercise Physiologist",
    ],
    phrases: ["therapy", "therapeutic", "physio", "occupational therap", "speech therap", "speech patholog", "psycholog"],
  },
  community: {
    label: "Community participation",
    registrationGroups: [
      "Participation in community/social and civic activities",
      "Innovative Community Participation",
      "Group and Centre Based Activities",
    ],
    serviceLabels: [],
    phrases: ["community participation", "social activity", "social activities", "community access"],
  },
  transport: {
    label: "Transport",
    registrationGroups: ["Assistance with travel/transport arrangements"],
    serviceLabels: ["Taxi or bus driver"],
    phrases: ["transport", "accessible travel", "travel assistance"],
  },
  employment: {
    label: "Employment",
    registrationGroups: [
      "Assistance to access and/or maintain employment and/or education",
      "Specialised Supported Employment",
    ],
    serviceLabels: [],
    phrases: ["employment", "job support", "find work", "find a job"],
  },
  assistive_technology: {
    label: "Assistive technology",
    registrationGroups: [
      "Personal Mobility Equipment", "Assistance products for personal care and safety",
      "Assistive products for household tasks",
    ],
    serviceLabels: [],
    phrases: ["assistive technology", "mobility equipment", "adaptive equipment"],
  },
  home_modifications: {
    label: "Home modifications",
    registrationGroups: ["Home modification design and construction"],
    serviceLabels: ["Builder"],
    phrases: ["home modification", "home modifications", "home adaptations"],
  },
  housing: {
    label: "Housing and SDA",
    registrationGroups: ["Specialist Disability Accommodation", "Accommodation / Tenancy Assistance"],
    serviceLabels: ["Housing Provider"],
    phrases: ["specialist disability accommodation", "sda", "disability housing", "accessible housing"],
  },
};
