import type { ProviderOutlet } from "@/data/provider-outlets.types";
import {
  regGroupAssignmentsFromIndices,
  regGroupIndicesToCategories,
  type RegGroupAssignment,
} from "@/app/provider-finder/regGroupOptions";
import {
  ACCESS_NEEDS,
  SUPPORT_TYPES,
  type SupportTypeId,
} from "@/lib/provider-finder/filters";

export type ProviderFundingClass = "ndis" | "private";

export type ClassifiedProviderOutlet = {
  id: string;
  name: string;
  state: string;
  postcode: string;
  active: boolean;
  funding: ProviderFundingClass;
  categories: string[];
  regGroupIndices: number[];
  regGroups: RegGroupAssignment[];
  supportTypes: SupportTypeId[];
  accessNeedIds: string[];
  haystack: string;
};

/**
 * NDIS RegGroup index → Provider Finder support type chips.
 * All 36 NDIS registration groups are mapped so every outlet with RegGroup
 * data receives at least one chip.
 */
const REG_GROUP_INDEX_TO_SUPPORT_TYPE: Record<number, SupportTypeId> = {
  // Assistive Services
  1: "home-help", // Accommodation / Tenancy Assistance
  2: "personal-care", // Assistance Animals
  3: "personal-care", // Assistance with daily life tasks in group/shared living
  4: "transport", // Assistance with travel/transport arrangements
  5: "personal-care", // Daily Personal Activities
  6: "personal-care", // Group and Centre Based Activities
  7: "personal-care", // High Intensity Daily Personal Activities
  8: "home-help", // Household tasks
  9: "therapy", // Interpreting and translation
  10: "personal-care", // Participation in community/social and civic activities
  // Assistive Technology
  11: "therapy", // Assistive equipment for recreation
  12: "home-help", // Assistive products for household tasks
  13: "personal-care", // Assistance products for personal care and safety
  14: "therapy", // Communication and information equipment
  15: "therapy", // Customised Prosthetics
  16: "therapy", // Hearing Equipment
  17: "therapy", // Hearing Services
  18: "transport", // Personal Mobility Equipment
  19: "therapy", // Specialised Hearing Services
  20: "therapy", // Vision Equipment
  // Capacity Building Services
  21: "personal-care", // Assistance in coordinating life stages/transitions
  22: "therapy", // Behaviour Support
  23: "therapy", // Community nursing care for high needs
  24: "therapy", // Development of daily living and life skills
  25: "therapy", // Early Intervention supports for early childhood
  26: "therapy", // Exercise Physiology and Physical Wellbeing activities
  27: "personal-care", // Innovative Community Participation
  28: "transport", // Specialised Driving Training
  29: "therapy", // Therapeutic Supports
  // Capital Services
  30: "home-help", // Home modification design and construction
  31: "home-help", // Specialist Disability Accommodation
  32: "transport", // Vehicle Modifications
  // Choice and Control Support Services
  33: "personal-care", // Plan Management (NDIS plan admin / navigation)
  34: "personal-care", // Support Coordination
  // Employment and Education Support Services
  35: "employment", // Assistance to access/maintain employment or education
  36: "employment", // Specialised Supported Employment
};

const SUPPORT_TYPE_ORDER: SupportTypeId[] = [
  "personal-care",
  "transport",
  "therapy",
  "employment",
  "home-help",
];

function outletId(outlet: ProviderOutlet, index: number): string {
  const name = (outlet.Prov_N?.trim() || outlet.Outletname?.trim() || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 30);
  return `${outlet.ABN}-${index}-${name}`;
}

function buildHaystack(parts: string[]): string {
  return parts.join(" ").toLowerCase();
}

export function supportTypesFromRegGroupIndices(
  indices: number[],
): SupportTypeId[] {
  const found = new Set<SupportTypeId>();
  for (const idx of indices) {
    const supportType = REG_GROUP_INDEX_TO_SUPPORT_TYPE[idx];
    if (supportType) found.add(supportType);
  }
  return SUPPORT_TYPE_ORDER.filter((id) => found.has(id));
}

export function accessNeedIdsFromHaystack(haystack: string): string[] {
  const lower = haystack.toLowerCase();
  return ACCESS_NEEDS.filter((need) =>
    need.keywords.some((keyword) => lower.includes(keyword)),
  ).map((need) => need.id);
}

export function fundingFromActive(active: boolean): ProviderFundingClass {
  return active ? "ndis" : "private";
}

export type ProviderOutletClassificationFields = {
  supportTypes: SupportTypeId[];
  accessNeedIds: string[];
};

export function classificationFieldsFromOutlet(
  outlet: ProviderOutlet,
): ProviderOutletClassificationFields {
  const classified = classifyProviderOutlet(outlet, 0);
  return {
    supportTypes: classified.supportTypes,
    accessNeedIds: classified.accessNeedIds,
  };
}

export function providerOutletFromRaw(
  raw: unknown,
  fallback?: Partial<ProviderOutlet>,
): ProviderOutlet | null {
  if (raw && typeof raw === "object" && "ABN" in raw && "RegGroup" in raw) {
    return raw as ProviderOutlet;
  }
  if (!fallback?.ABN) return null;
  return fallback as ProviderOutlet;
}

export function classifyProviderOutlet(
  outlet: ProviderOutlet,
  index = 0,
): ClassifiedProviderOutlet {
  const regGroups = regGroupAssignmentsFromIndices(outlet.RegGroup);
  const categories = regGroups.map((row) => row.regGroup);
  const professionParts = outlet.prfsn
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  const categoriesMerged =
    categories.length > 0
      ? categories
      : professionParts.length > 0
        ? professionParts
        : [];

  const name = (outlet.Prov_N?.trim() || outlet.Outletname?.trim() || "Unknown").trim();
  const haystack = buildHaystack([
    name,
    outlet.Outletname,
    outlet.Address,
    outlet.Head_Office,
    ...categoriesMerged,
    outlet.prfsn,
  ]);

  const active = outlet.Active === 1;

  return {
    id: outletId(outlet, index),
    name,
    state: outlet.State_cd,
    postcode: String(outlet.Post_cd),
    active,
    funding: fundingFromActive(active),
    categories: categoriesMerged,
    regGroupIndices: outlet.RegGroup,
    regGroups,
    supportTypes: supportTypesFromRegGroupIndices(outlet.RegGroup),
    accessNeedIds: accessNeedIdsFromHaystack(haystack),
    haystack,
  };
}

export function classifyProviderOutlets(
  outlets: ProviderOutlet[],
): ClassifiedProviderOutlet[] {
  return outlets.map((outlet, index) => classifyProviderOutlet(outlet, index));
}

export type ClassificationSummary = {
  total: number;
  activeCount: number;
  inactiveCount: number;
  byFunding: Record<ProviderFundingClass, number>;
  bySupportType: Record<SupportTypeId, number>;
  byAccessNeed: Record<string, number>;
  byState: Record<string, number>;
  byRegGroup: Record<string, number>;
  byRegGroupIndex: Record<number, number>;
  noRegGroup: number;
  unclassifiedSupportType: number;
  multiSupportType: number;
};

export function summarizeClassifications(
  rows: ClassifiedProviderOutlet[],
): ClassificationSummary {
  const byFunding: Record<ProviderFundingClass, number> = {
    ndis: 0,
    private: 0,
  };
  const bySupportType = Object.fromEntries(
    SUPPORT_TYPES.filter((t) => t.id !== "all").map((t) => [t.id, 0]),
  ) as Record<SupportTypeId, number>;
  const byAccessNeed: Record<string, number> = Object.fromEntries(
    ACCESS_NEEDS.map((n) => [n.id, 0]),
  );
  const byState: Record<string, number> = {};
  const byRegGroup: Record<string, number> = {};
  const byRegGroupIndex: Record<number, number> = {};

  let activeCount = 0;
  let noRegGroup = 0;
  let unclassifiedSupportType = 0;
  let multiSupportType = 0;

  for (const row of rows) {
    if (row.active) activeCount += 1;
    byFunding[row.funding] += 1;
    byState[row.state] = (byState[row.state] ?? 0) + 1;

    if (row.regGroups.length === 0) noRegGroup += 1;
    if (row.supportTypes.length === 0) unclassifiedSupportType += 1;
    if (row.supportTypes.length > 1) multiSupportType += 1;

    for (const regGroup of row.regGroups) {
      byRegGroup[regGroup.regGroup] = (byRegGroup[regGroup.regGroup] ?? 0) + 1;
      byRegGroupIndex[regGroup.index] =
        (byRegGroupIndex[regGroup.index] ?? 0) + 1;
    }
    for (const supportType of row.supportTypes) {
      bySupportType[supportType] += 1;
    }
    for (const needId of row.accessNeedIds) {
      byAccessNeed[needId] = (byAccessNeed[needId] ?? 0) + 1;
    }
  }

  return {
    total: rows.length,
    activeCount,
    inactiveCount: rows.length - activeCount,
    byFunding,
    bySupportType,
    byAccessNeed,
    byState,
    byRegGroup,
    byRegGroupIndex,
    noRegGroup,
    unclassifiedSupportType,
    multiSupportType,
  };
}
