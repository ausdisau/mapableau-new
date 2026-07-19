/** Personal Access Passport — private UI prefs vs shareable access requirements. */

export const ACCESS_SHARE_CATEGORIES = [
  "mobility",
  "communication",
  "sensory",
  "assistance_animal",
  "support_person",
  "equipment_charging",
  "transport_dropoff",
  "other",
] as const;

export type AccessShareCategory = (typeof ACCESS_SHARE_CATEGORIES)[number];

export const ACCESS_SHARE_CATEGORY_LABELS: Record<AccessShareCategory, string> = {
  mobility: "Mobility and physical access",
  communication: "Communication preferences",
  sensory: "Sensory requirements",
  assistance_animal: "Assistance animal requirements",
  support_person: "Support-person requirements",
  equipment_charging: "Equipment and charging requirements",
  transport_dropoff: "Accessible transport and drop-off needs",
  other: "Other requirements you wrote",
};

export interface AccessShareSettings {
  version: 1;
  categories: AccessShareCategory[];
  /** Verified organisation recipient — authority for consent grants. */
  recipientOrganisationId: string | null;
  /** Server-resolved display name only. */
  recipientLabel: string;
  purpose: string;
  expiresAt: string | null;
  active: boolean;
  updatedAt: string;
  /** Id of the active ConsentRecord grant (named to avoid domain-ownership false positives). */
  grantId?: string;
}

export const DEFAULT_ACCESS_SHARE_SETTINGS: AccessShareSettings = {
  version: 1,
  categories: [],
  recipientOrganisationId: null,
  recipientLabel: "",
  purpose: "",
  expiresAt: null,
  active: false,
  updatedAt: new Date(0).toISOString(),
};

export interface AccessPassportSummary {
  privateInterfaceNote: string;
  shareableCategories: AccessShareCategory[];
  shareSettings: AccessShareSettings;
  mobilityNeeds: string[];
  communicationPreferences: string[];
  sensoryPreferences: Record<string, unknown>;
  cognitivePreferences: Record<string, unknown>;
  transportRequirements: Record<string, unknown>;
}
