import type {
  JourneyOptimisationPreference,
  RouteRecommendationStatus,
  TrafficAwareRouteCandidate,
} from "@/types/maji";

export type RankerThresholds = {
  minTimeSavingSeconds: number;
  minCostSavingCents: number;
};

export type RankerResult = {
  status: RouteRecommendationStatus;
  recommended: TrafficAwareRouteCandidate | null;
  alternatives: TrafficAwareRouteCandidate[];
  current: TrafficAwareRouteCandidate | null;
  explanation: string;
  requiresHumanReview: boolean;
};

function timeSavingSeconds(
  current: TrafficAwareRouteCandidate | null,
  candidate: TrafficAwareRouteCandidate
): number | null {
  if (!current) return null;
  return current.remainingDurationSeconds - candidate.remainingDurationSeconds;
}

function costSavingCents(
  current: TrafficAwareRouteCandidate | null,
  candidate: TrafficAwareRouteCandidate
): number | null {
  if (
    current?.cost.totalRemainingCents == null ||
    candidate.cost.totalRemainingCents == null
  ) {
    return null;
  }
  return current.cost.totalRemainingCents - candidate.cost.totalRemainingCents;
}

function annotate(
  candidate: TrafficAwareRouteCandidate,
  includeReasons: string[],
  excludeReasons: string[]
): TrafficAwareRouteCandidate {
  return { ...candidate, includeReasons, excludeReasons };
}

function meetsSavingFloor(
  candidate: TrafficAwareRouteCandidate,
  current: TrafficAwareRouteCandidate,
  thresholds: RankerThresholds
): { ok: boolean; include: string[]; exclude: string[] } {
  const timeSaved = timeSavingSeconds(current, candidate) ?? 0;
  const costSaved = costSavingCents(current, candidate);
  const include: string[] = [];
  const exclude: string[] = [];

  if (timeSaved >= thresholds.minTimeSavingSeconds) {
    include.push(
      `Saves about ${Math.round(timeSaved / 60)} minutes compared with the current remaining route.`
    );
  }
  if (costSaved != null && costSaved >= thresholds.minCostSavingCents) {
    include.push(
      `Operating cost is about $${(costSaved / 100).toFixed(2)} lower than the current remaining route.`
    );
  }
  if (
    timeSaved < thresholds.minTimeSavingSeconds &&
    (costSaved == null || costSaved < thresholds.minCostSavingCents)
  ) {
    exclude.push(
      "The time or operating-cost saving is too small to recommend a change."
    );
    return { ok: false, include, exclude };
  }
  if (include.length === 0) {
    include.push("This option meets the comparison thresholds for a review.");
  }
  return { ok: true, include, exclude };
}

function pickByPreference(
  preference: JourneyOptimisationPreference,
  eligible: TrafficAwareRouteCandidate[],
  current: TrafficAwareRouteCandidate,
  thresholds: RankerThresholds
): TrafficAwareRouteCandidate | null {
  if (eligible.length === 0) return null;
  const copy = [...eligible];
  switch (preference) {
    case "earliest_arrival":
      copy.sort(
        (a, b) => a.remainingDurationSeconds - b.remainingDurationSeconds
      );
      return copy[0] ?? null;
    case "lowest_cost": {
      const cheaper = copy.filter((candidate) => {
        if (
          candidate.cost.totalRemainingCents == null ||
          current.cost.totalRemainingCents == null
        ) {
          return false;
        }
        return (
          current.cost.totalRemainingCents - candidate.cost.totalRemainingCents >=
          thresholds.minCostSavingCents
        );
      });
      cheaper.sort(
        (a, b) =>
          (a.cost.totalRemainingCents ?? Number.POSITIVE_INFINITY) -
          (b.cost.totalRemainingCents ?? Number.POSITIVE_INFINITY)
      );
      return cheaper[0] ?? null;
    }
    case "minimise_disruption": {
      const strong = copy.filter((candidate) => {
        const saved = timeSavingSeconds(current, candidate) ?? 0;
        return saved >= thresholds.minTimeSavingSeconds * 2;
      });
      strong.sort(
        (a, b) => a.remainingDurationSeconds - b.remainingDurationSeconds
      );
      return strong[0] ?? null;
    }
    case "balanced": {
      const maxTime = Math.max(
        current.remainingDurationSeconds,
        ...copy.map((c) => c.remainingDurationSeconds)
      );
      const costs = [current, ...copy]
        .map((c) => c.cost.totalRemainingCents)
        .filter((v): v is number => v != null);
      const maxCost = costs.length ? Math.max(...costs) : 0;
      copy.sort((a, b) => {
        const aTime = a.remainingDurationSeconds / Math.max(maxTime, 1);
        const bTime = b.remainingDurationSeconds / Math.max(maxTime, 1);
        const aCost =
          maxCost === 0 || a.cost.totalRemainingCents == null
            ? aTime
            : a.cost.totalRemainingCents / maxCost;
        const bCost =
          maxCost === 0 || b.cost.totalRemainingCents == null
            ? bTime
            : b.cost.totalRemainingCents / maxCost;
        return aTime + aCost - (bTime + bCost);
      });
      return copy[0] ?? null;
    }
    default: {
      const _exhaustive: never = preference;
      return _exhaustive;
    }
  }
}

export function rankRouteCandidates(params: {
  preference: JourneyOptimisationPreference;
  current: TrafficAwareRouteCandidate | null;
  alternatives: TrafficAwareRouteCandidate[];
  thresholds: RankerThresholds;
  sourceUnavailable?: boolean;
  stale?: boolean;
}): RankerResult {
  const alternatives = params.alternatives.map((candidate) => ({
    ...candidate,
    timeSavingSeconds: timeSavingSeconds(params.current, candidate),
    cost: {
      ...candidate.cost,
      operatingCostDifferenceCents:
        params.current?.cost.totalRemainingCents == null ||
        candidate.cost.totalRemainingCents == null
          ? null
          : candidate.cost.totalRemainingCents -
            params.current.cost.totalRemainingCents,
    },
  }));

  if (params.sourceUnavailable || !params.current) {
    return {
      status: "source_unavailable",
      recommended: null,
      alternatives,
      current: params.current,
      explanation:
        "A comparison could not be completed because a route source was unavailable. The booking is unchanged.",
      requiresHumanReview: false,
    };
  }

  if (params.stale) {
    return {
      status: "stale",
      recommended: null,
      alternatives,
      current: params.current,
      explanation:
        "The stored comparison is older than its validity window. Request a new advisory comparison. The booking is unchanged.",
      requiresHumanReview: false,
    };
  }

  const annotated: TrafficAwareRouteCandidate[] = [];
  const eligible: TrafficAwareRouteCandidate[] = [];

  for (const candidate of alternatives) {
    if (!candidate.constraints.passed) {
      annotated.push(
        annotate(candidate, [], [
          ...candidate.constraints.reasons,
          "This option is excluded from ranking.",
        ])
      );
      continue;
    }
    const floor = meetsSavingFloor(
      candidate,
      params.current,
      params.thresholds
    );
    const next = annotate(candidate, floor.include, floor.exclude);
    annotated.push(next);
    if (floor.ok) eligible.push(next);
  }

  const picked = pickByPreference(
    params.preference,
    eligible,
    params.current,
    params.thresholds
  );
  const requiresHumanReview = Boolean(
    params.current.constraints.requiresHumanReview ||
      picked?.constraints.requiresHumanReview
  );

  if (!picked) {
    const hardFail = alternatives.some(
      (candidate) => candidate.constraints.status === "constraint_violation"
    );
    return {
      status: hardFail && eligible.length === 0 && alternatives.length > 0
        ? "constraint_violation"
        : "no_alternative",
      recommended: null,
      alternatives: annotated,
      current: params.current,
      explanation: hardFail
        ? "Other options were excluded because they miss the arrival commitment or accessibility requirements. The booking is unchanged."
        : "No alternative is clearly better than the current remaining route. The booking is unchanged.",
      requiresHumanReview:
        requiresHumanReview ||
        alternatives.some((c) => c.constraints.requiresHumanReview),
    };
  }

  const recommended: TrafficAwareRouteCandidate = {
    ...picked,
    role: "recommended",
  };
  const rest = annotated
    .filter((candidate) => candidate.id !== picked.id)
    .map((candidate) =>
      candidate.role === "recommended"
        ? { ...candidate, role: "alternative" as const }
        : candidate
    );

  const status: RouteRecommendationStatus = requiresHumanReview
    ? "human_review_required"
    : "recommended";

  return {
    status,
    recommended,
    alternatives: rest,
    current: params.current,
    explanation: requiresHumanReview
      ? `${picked.includeReasons[0] ?? "An alternative is available."} A person still needs to review it. The booking is unchanged.`
      : `${picked.includeReasons[0] ?? "An alternative remaining route is available."} This is advisory only and does not change the booking or quote.`,
    requiresHumanReview,
  };
}
