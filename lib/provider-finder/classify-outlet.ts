import type { ProviderOutlet } from "@/data/provider-outlets.types";
import { regGroupIndicesToCategories } from "@/app/provider-finder/regGroupOptions";
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
  supportTypes: SupportTypeId[];
  accessNeedIds: string[];
  haystack: string;
};

/** NDIS RegGroup index → Provider Finder support type chips. */
const REG_GROUP_INDEX_TO_SUPPORT_TYPE: Partial<Record<number, SupportTypeId>> = {
  1: "home-help",
  3: "personal-care",
  4: "transport",
  5: "personal-care",
  7: "personal-care",
  8: "home-help",
  17: "therapy",
  19: "therapy",
  22: "therapy",
  23: "therapy",
  24: "therapy",
  25: "therapy",
  26: "therapy",
  28: "transport",
  29: "therapy",
  30: "home-help",
  31: "home-help",
  32: "transport",
  35: "employment",
  36: "employment",
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

export function classifyProviderOutlet(
  outlet: ProviderOutlet,
  index = 0,
): ClassifiedProviderOutlet {
  const categories = regGroupIndicesToCategories(outlet.RegGroup);
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

  let activeCount = 0;
  let unclassifiedSupportType = 0;
  let multiSupportType = 0;

  for (const row of rows) {
    if (row.active) activeCount += 1;
    byFunding[row.funding] += 1;
    byState[row.state] = (byState[row.state] ?? 0) + 1;

    if (row.supportTypes.length === 0) unclassifiedSupportType += 1;
    if (row.supportTypes.length > 1) multiSupportType += 1;

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
    unclassifiedSupportType,
    multiSupportType,
  };
}
