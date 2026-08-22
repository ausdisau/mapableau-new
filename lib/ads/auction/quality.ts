import {
  QUALITY_MAX_MILLI,
  QUALITY_MIN_MILLI,
  QUALITY_NEUTRAL_MILLI,
} from "@/lib/ads/auction/config";
import type { AdRankingReasonCode, InternalAdContext } from "@/lib/ads/types";

/**
 * Bounded quality score (milli-units, 500–1500).
 * May use: semantic/category relevance, coarse geo, creative approval, placement match.
 * MUST NOT use: disability, diagnosis, NDIS, AAC, clinical, identity, suitability,
 * accessibility score, race, religion, sexuality, politics, financial vulnerability.
 */
export function computeQualityScoreMilli(input: {
  reasonCodes: AdRankingReasonCode[];
  context: Pick<InternalAdContext, "category" | "regionCode">;
  campaignCategory?: string | null;
  campaignRegion?: string | null;
  creativeApproved: boolean;
}): number {
  let score = QUALITY_NEUTRAL_MILLI;

  if (!input.creativeApproved) {
    return QUALITY_MIN_MILLI;
  }

  if (input.reasonCodes.includes("CATEGORY_MATCH")) {
    score += 150;
  } else if (
    input.campaignCategory &&
    input.context.category &&
    input.campaignCategory.toLowerCase() !== input.context.category.toLowerCase()
  ) {
    score -= 100;
  }

  if (input.reasonCodes.includes("REGION_MATCH")) {
    score += 100;
  } else if (
    input.campaignRegion &&
    input.campaignRegion.toLowerCase() !== "national" &&
    input.context.regionCode &&
    input.campaignRegion.toLowerCase() !== input.context.regionCode.toLowerCase()
  ) {
    score -= 100;
  }

  if (input.reasonCodes.includes("GEO_MATCH")) {
    score += 50;
  }

  if (input.reasonCodes.includes("PLACEMENT_MATCH")) {
    score += 50;
  }

  return Math.min(QUALITY_MAX_MILLI, Math.max(QUALITY_MIN_MILLI, score));
}

/** Prohibited quality inputs — invariant tests. */
export const PROHIBITED_QUALITY_FACTORS = [
  "disability",
  "diagnosis",
  "ndis",
  "ndisFunding",
  "aac",
  "clinicalHistory",
  "participantIdentity",
  "providerSuitability",
  "accessibilityScore",
  "race",
  "religion",
  "sexuality",
  "politics",
  "financialVulnerability",
] as const;
