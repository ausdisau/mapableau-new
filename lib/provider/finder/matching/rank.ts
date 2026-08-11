import type { NdisProviderSearchRow } from "@/lib/ingestion/ndis-providers-search";
import { ACCESS_NEEDS } from "@/lib/provider/finder/filters";

/** Participant-controlled ranking weights. Must never override hard constraints. */
export type ParticipantRankingWeights = {
  continuity: number;
  preferences: number;
  relevantExperience: number;
  accessibilityEvidence: number;
  travelBurden: number;
  availability: number;
};

export const DEFAULT_PARTICIPANT_WEIGHTS: ParticipantRankingWeights = {
  continuity: 0.2,
  preferences: 0.25,
  relevantExperience: 0.2,
  accessibilityEvidence: 0.2,
  travelBurden: 0.1,
  availability: 0.05,
};

export type RankedProvider = {
  provider: NdisProviderSearchRow;
  score: number;
  factors: Array<{ key: keyof ParticipantRankingWeights; contribution: number; note: string }>;
  missingData: string[];
};

export type RankingContext = {
  preferredProviderSourceIds?: string[];
  preferredServiceKeywords?: string[];
  requiredAccessNeedIds?: string[];
  participantPostcode?: string | null;
};

function clampWeights(weights: ParticipantRankingWeights): ParticipantRankingWeights {
  const entries = Object.entries(weights) as Array<
    [keyof ParticipantRankingWeights, number]
  >;
  const sanitized = Object.fromEntries(
    entries.map(([key, value]) => [key, Math.max(0, Math.min(1, value))]),
  ) as ParticipantRankingWeights;
  const sum = Object.values(sanitized).reduce((a, b) => a + b, 0) || 1;
  return Object.fromEntries(
    Object.entries(sanitized).map(([key, value]) => [key, value / sum]),
  ) as ParticipantRankingWeights;
}

/**
 * Stage 2 ranking. Never ranks participants by complexity/desirability.
 * Never uses disability-derived or health-derived proxies as desirability scores.
 */
export function rankEligibleProviders(
  eligible: NdisProviderSearchRow[],
  weights: ParticipantRankingWeights,
  context: RankingContext = {},
): RankedProvider[] {
  const w = clampWeights(weights);
  const preferred = new Set(context.preferredProviderSourceIds ?? []);
  const serviceKeywords = (context.preferredServiceKeywords ?? []).map((k) =>
    k.toLowerCase(),
  );
  const accessKeywords = ACCESS_NEEDS.filter((need) =>
    (context.requiredAccessNeedIds ?? []).includes(need.id),
  ).flatMap((need) => need.keywords.map((k) => k.toLowerCase()));

  return eligible
    .map((provider) => {
      const missingData: string[] = [];
      const factors: RankedProvider["factors"] = [];
      const text = [
        provider.provider_name,
        ...(provider.services ?? []),
        ...(provider.registration_groups ?? []),
      ]
        .join(" ")
        .toLowerCase();

      const continuity = preferred.has(provider.source_id) ? 1 : 0;
      factors.push({
        key: "continuity",
        contribution: continuity * w.continuity,
        note: continuity
          ? "Previously preferred provider"
          : "No continuity signal",
      });

      const preferenceHits = serviceKeywords.filter((k) => text.includes(k)).length;
      const preferences =
        serviceKeywords.length === 0
          ? 0.5
          : Math.min(1, preferenceHits / serviceKeywords.length);
      if (serviceKeywords.length === 0) missingData.push("preference_keywords");
      factors.push({
        key: "preferences",
        contribution: preferences * w.preferences,
        note: `Matched ${preferenceHits} preference keyword(s)`,
      });

      const experience = Math.min(1, (provider.services?.length ?? 0) / 5);
      if (!provider.services?.length) missingData.push("services");
      factors.push({
        key: "relevantExperience",
        contribution: experience * w.relevantExperience,
        note: `${provider.services?.length ?? 0} listed service(s)`,
      });

      const accessHits = accessKeywords.filter((k) => text.includes(k)).length;
      const accessibility =
        accessKeywords.length === 0
          ? 0.5
          : Math.min(1, accessHits / Math.max(1, accessKeywords.length));
      if (accessKeywords.length > 0 && accessHits === 0) {
        missingData.push("accessibility_evidence");
      }
      factors.push({
        key: "accessibilityEvidence",
        contribution: accessibility * w.accessibilityEvidence,
        note:
          accessKeywords.length === 0
            ? "No access needs specified"
            : `Access keyword hits: ${accessHits}`,
      });

      let travel = 0.5;
      if (context.participantPostcode && provider.postcode) {
        travel = provider.postcode === context.participantPostcode ? 1 : 0.4;
      } else {
        missingData.push("travel_distance");
      }
      factors.push({
        key: "travelBurden",
        contribution: travel * w.travelBurden,
        note: "Postcode proximity proxy (directory only)",
      });

      // Directory has no live availability — disclose missing data.
      missingData.push("live_availability");
      factors.push({
        key: "availability",
        contribution: 0.5 * w.availability,
        note: "Live availability not in directory",
      });

      const score = factors.reduce((sum, factor) => sum + factor.contribution, 0);
      return { provider, score, factors, missingData };
    })
    .sort((a, b) => b.score - a.score);
}
