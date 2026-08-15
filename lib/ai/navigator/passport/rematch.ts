import { applyHardConstraints } from "@/lib/ai/navigator/matching/hard-constraints";
import { buildMatchResult } from "@/lib/ai/navigator/matching/rank";
import { ndisProviderHardFilter } from "@/lib/ai/navigator/matching/search-tool";
import {
  DEFAULT_RANKING_WEIGHTS,
  hardConstraintsSchema,
  rankingWeightsSchema,
  type HardConstraints,
  type HardConstraintsInput,
  type MatchResult,
  type RankingWeights,
} from "@/lib/ai/navigator/matching/types";
import type {
  HardConstraint,
  RankingWeights as PassportRankingWeights,
} from "@/lib/ai/navigator/passport/types";
import { isNavigatorMatchingEnabled } from "@/lib/config/navigator-pilot";

/**
 * Convert passport display constraints back into Stage-1 matching keys.
 * Labels written by the orchestrator are the stable mapping.
 */
export function matchingConstraintsFromPassportLabels(
  constraints: HardConstraint[],
): HardConstraints {
  const input: HardConstraintsInput = {
    requiredServices: [],
    exclusions: [],
    communicationRequirements: [],
    accessibilityRequirements: [],
    credentialRequirements: [],
    nonNegotiableKeys: [],
  };

  const nonNegotiableKeys = new Set<
    NonNullable<HardConstraintsInput["nonNegotiableKeys"]>[number]
  >();

  for (const item of constraints) {
    const label = item.label.trim();
    const value = item.value;

    if (label === "serviceType" && typeof value === "string") {
      input.serviceType = value;
      if (item.nonNegotiable) nonNegotiableKeys.add("serviceType");
    } else if (label === "state" && typeof value === "string") {
      input.state = value;
      if (item.nonNegotiable) nonNegotiableKeys.add("state");
    } else if (label === "postcode" && typeof value === "string") {
      input.postcode = value;
      if (item.nonNegotiable) nonNegotiableKeys.add("postcode");
    } else if (label === "exclusion" && typeof value === "string") {
      input.exclusions = [...(input.exclusions ?? []), value];
      if (item.nonNegotiable) nonNegotiableKeys.add("exclusions");
    } else if (label === "accessibility" && typeof value === "string") {
      input.accessibilityRequirements = [
        ...(input.accessibilityRequirements ?? []),
        value,
      ];
      if (item.nonNegotiable) nonNegotiableKeys.add("accessibilityRequirements");
    } else if (label === "communication" && typeof value === "string") {
      input.communicationRequirements = [
        ...(input.communicationRequirements ?? []),
        value,
      ];
      if (item.nonNegotiable) nonNegotiableKeys.add("communicationRequirements");
    } else if (label === "credential" && typeof value === "string") {
      input.credentialRequirements = [
        ...(input.credentialRequirements ?? []),
        value,
      ];
      if (item.nonNegotiable) nonNegotiableKeys.add("credentialRequirements");
    }
  }

  input.nonNegotiableKeys = [...nonNegotiableKeys];
  return hardConstraintsSchema.parse(input);
}

/**
 * Map passport ranking weights (legacy aliases + matching keys) onto
 * the deterministic Stage-2 weight schema.
 */
export function matchingWeightsFromPassport(
  weights: PassportRankingWeights,
): RankingWeights {
  const record = weights as Record<string, number | undefined>;
  return rankingWeightsSchema.parse({
    continuity: record.continuity ?? DEFAULT_RANKING_WEIGHTS.continuity,
    participantPreference:
      record.participantPreference ??
      DEFAULT_RANKING_WEIGHTS.participantPreference,
    verifiedAccessibility:
      record.verifiedAccessibility ??
      record.accessibilityFit ??
      DEFAULT_RANKING_WEIGHTS.verifiedAccessibility,
    travelBurden:
      record.travelBurden ??
      record.proximity ??
      DEFAULT_RANKING_WEIGHTS.travelBurden,
    availability: record.availability ?? DEFAULT_RANKING_WEIGHTS.availability,
    communicationFit:
      record.communicationFit ?? DEFAULT_RANKING_WEIGHTS.communicationFit,
  });
}

/**
 * Re-run Stage-1 + Stage-2 matching after a participant correction.
 * Never relaxes hard constraints. Returns null when matching flag is off.
 */
export async function rematchAfterPassportCorrection(input: {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  hardConstraints: HardConstraint[];
  rankingWeights: PassportRankingWeights;
  query?: string;
  silent?: boolean;
  now?: Date;
}): Promise<MatchResult | null> {
  if (!isNavigatorMatchingEnabled()) {
    return null;
  }

  const constraints = matchingConstraintsFromPassportLabels(
    input.hardConstraints,
  );
  const weights = matchingWeightsFromPassport(input.rankingWeights);

  const search = await ndisProviderHardFilter({
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    constraints,
    q: input.query,
    silent: input.silent,
    now: input.now,
  });

  const applied = applyHardConstraints(
    search.candidates,
    constraints,
    input.now,
  );

  return buildMatchResult({
    eligible: applied.eligible,
    eliminationSummary: applied.eliminationSummary,
    constraints,
    weights,
    now: input.now,
  });
}
