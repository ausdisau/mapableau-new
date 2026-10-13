import type { AgencyMemoryCategory } from "./types";
import {
  AGENCY_MEMORY_CATEGORIES,
  PROHIBITED_MEMORY_CATEGORIES,
} from "./types";

export type CategoryRegistryEntry = {
  category: AgencyMemoryCategory;
  label: string;
  plainLanguage: string;
  defaultEdgeType:
    | "HAS_PREFERENCE"
    | "EXCLUDES"
    | "PREFERS"
    | "CHOOSES"
    | "PURSUES";
  /** Jobs disclosure and similar must stay purpose-bound. */
  requiresPurpose: boolean;
  typicalConsentScopes: string[];
};

export const CATEGORY_REGISTRY: Record<
  AgencyMemoryCategory,
  CategoryRegistryEntry
> = {
  communication: {
    category: "communication",
    label: "Communication",
    plainLanguage: "How you prefer to be contacted and supported to communicate.",
    defaultEdgeType: "HAS_PREFERENCE",
    requiresPurpose: false,
    typicalConsentScopes: ["profile.write", "communication.preferences"],
  },
  access: {
    category: "access",
    label: "Access",
    plainLanguage: "Access needs you have chosen to share for planning.",
    defaultEdgeType: "HAS_PREFERENCE",
    requiresPurpose: false,
    typicalConsentScopes: ["profile.write", "access.preferences"],
  },
  care: {
    category: "care",
    label: "Care",
    plainLanguage: "Care and support preferences you confirmed.",
    defaultEdgeType: "PREFERS",
    requiresPurpose: false,
    typicalConsentScopes: ["care.manage", "profile.write"],
  },
  transport: {
    category: "transport",
    label: "Transport",
    plainLanguage: "Transport and mobility preferences you confirmed.",
    defaultEdgeType: "HAS_PREFERENCE",
    requiresPurpose: false,
    typicalConsentScopes: ["transport.manage", "profile.write"],
  },
  jobs: {
    category: "jobs",
    label: "Work",
    plainLanguage: "Work and participation preferences for a stated purpose.",
    defaultEdgeType: "HAS_PREFERENCE",
    requiresPurpose: true,
    typicalConsentScopes: ["jobs.preferences"],
  },
  provider_preference: {
    category: "provider_preference",
    label: "Preferred providers",
    plainLanguage: "Providers or workers you prefer.",
    defaultEdgeType: "PREFERS",
    requiresPurpose: false,
    typicalConsentScopes: ["profile.write"],
  },
  provider_exclusion: {
    category: "provider_exclusion",
    label: "Excluded providers",
    plainLanguage: "Providers or workers you asked MapAble not to use.",
    defaultEdgeType: "EXCLUDES",
    requiresPurpose: false,
    typicalConsentScopes: ["profile.write"],
  },
  privacy: {
    category: "privacy",
    label: "Privacy",
    plainLanguage: "Privacy choices about what MapAble may remember or share.",
    defaultEdgeType: "CHOOSES",
    requiresPurpose: false,
    typicalConsentScopes: ["privacy.preferences"],
  },
  disclosure: {
    category: "disclosure",
    label: "Disclosure",
    plainLanguage:
      "What you choose to disclose, for a specific purpose only.",
    defaultEdgeType: "CHOOSES",
    requiresPurpose: true,
    typicalConsentScopes: ["disclosure.preferences", "jobs.preferences"],
  },
  interaction: {
    category: "interaction",
    label: "Interaction",
    plainLanguage: "How you prefer MapAble to interact with you.",
    defaultEdgeType: "HAS_PREFERENCE",
    requiresPurpose: false,
    typicalConsentScopes: ["profile.write", "interaction.preferences"],
  },
  mission_preference: {
    category: "mission_preference",
    label: "Mission preferences",
    plainLanguage: "Mission and goal preferences you confirmed.",
    defaultEdgeType: "PURSUES",
    requiresPurpose: false,
    typicalConsentScopes: ["profile.write", "mission.preferences"],
  },
};

export function getCategoryEntry(
  category: AgencyMemoryCategory,
): CategoryRegistryEntry {
  return CATEGORY_REGISTRY[category];
}

export function isGovernedCategory(category: string): boolean {
  return (AGENCY_MEMORY_CATEGORIES as readonly string[]).includes(category);
}

export function isProhibitedCategory(category: string): boolean {
  const normalized = category.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (
    (PROHIBITED_MEMORY_CATEGORIES as readonly string[]).includes(normalized)
  ) {
    return true;
  }
  return (
    normalized.includes("personality") ||
    normalized.includes("loneliness") ||
    normalized.includes("deserving") ||
    normalized.includes("credibility") ||
    normalized.includes("psychological") ||
    normalized.includes("behavioural_score") ||
    normalized.includes("behavioral_score") ||
    normalized.includes("inferred_capacity") ||
    normalized.includes("risk_tolerance") ||
    normalized.includes("emotional_instability") ||
    (normalized.includes("capacity") && !normalized.includes("accessibility"))
  );
}

export function assertGovernedCategory(category: string): AgencyMemoryCategory {
  if (isProhibitedCategory(category)) {
    throw new Error(`AGENCY_MEMORY_PROHIBITED_CATEGORY:${category}`);
  }
  if (!isGovernedCategory(category)) {
    throw new Error(`AGENCY_MEMORY_CATEGORY_NOT_ALLOWED:${category}`);
  }
  return category as AgencyMemoryCategory;
}

/** CareOS preference keys → Agency Memory category mapping. */
export const CAREOS_KEY_TO_CATEGORY: Record<string, AgencyMemoryCategory> = {
  preferred_contact_method: "communication",
  preferred_response_format: "communication",
  communication_support_preference: "communication",
  preferred_pickup_buffer_minutes: "transport",
  transport_assistance_preference: "transport",
  venue_access_priority: "access",
  regular_worker_preference: "provider_preference",
};
