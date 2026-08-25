import type {
  ControlPlaneSubsystem,
  SloCandidate,
  SloMetricId,
} from "./types";

/**
 * SLO *candidates* only — targets stay null until operators set
 * evidence-based values. Do not invent production SLOs.
 */

type CandidateSeed = {
  id: string;
  subsystem: ControlPlaneSubsystem;
  metric: SloMetricId;
  description: string;
  unit: SloCandidate["unit"];
  window: SloCandidate["window"];
};

const CANDIDATE_SEEDS: CandidateSeed[] = [
  {
    id: "mission_runtime.availability",
    subsystem: "mission_runtime",
    metric: "availability",
    description: "Mission planning success ratio (excludes participant declines).",
    unit: "ratio",
    window: "24h",
  },
  {
    id: "mission_runtime.latency_p95",
    subsystem: "mission_runtime",
    metric: "latency_p95_ms",
    description: "p95 latency for deterministic mission plan compilation.",
    unit: "milliseconds",
    window: "1h",
  },
  {
    id: "mission_runtime.failed_planning",
    subsystem: "mission_runtime",
    metric: "failed_mission_planning_rate",
    description: "Rate of mission plans ending blocked due to system failure.",
    unit: "ratio",
    window: "24h",
  },
  {
    id: "action_kernel.availability",
    subsystem: "action_kernel",
    metric: "availability",
    description: "Approved action execution success ratio.",
    unit: "ratio",
    window: "24h",
  },
  {
    id: "action_kernel.blocked_action_rate",
    subsystem: "action_kernel",
    metric: "blocked_action_rate",
    description:
      "Policy/authority blocked action rate (not participant rejection).",
    unit: "ratio",
    window: "24h",
  },
  {
    id: "action_kernel.latency_p95",
    subsystem: "action_kernel",
    metric: "latency_p95_ms",
    description: "p95 latency for action execute path after approval binding.",
    unit: "milliseconds",
    window: "1h",
  },
  {
    id: "context_fabric.availability",
    subsystem: "context_fabric",
    metric: "availability",
    description: "Authorised context read success ratio.",
    unit: "ratio",
    window: "24h",
  },
  {
    id: "context_fabric.latency_p95",
    subsystem: "context_fabric",
    metric: "latency_p95_ms",
    description: "p95 latency for context fabric reads.",
    unit: "milliseconds",
    window: "1h",
  },
  {
    id: "recovery_engine.availability",
    subsystem: "recovery_engine",
    metric: "availability",
    description: "Recovery reassessment completion ratio (no auto-redecision).",
    unit: "ratio",
    window: "24h",
  },
  {
    id: "recovery_engine.latency_p95",
    subsystem: "recovery_engine",
    metric: "latency_p95_ms",
    description: "p95 latency for recovery alternative generation.",
    unit: "milliseconds",
    window: "1h",
  },
  {
    id: "connector_gateway.availability",
    subsystem: "connector_gateway",
    metric: "availability",
    description: "Connector call success ratio excluding policy denials.",
    unit: "ratio",
    window: "24h",
  },
  {
    id: "connector_gateway.degradation",
    subsystem: "connector_gateway",
    metric: "connector_degradation_rate",
    description: "Share of connector calls returning degraded/stub fallback.",
    unit: "ratio",
    window: "24h",
  },
  {
    id: "connector_gateway.latency_p95",
    subsystem: "connector_gateway",
    metric: "latency_p95_ms",
    description: "p95 connector round-trip latency.",
    unit: "milliseconds",
    window: "1h",
  },
  {
    id: "human_review.backlog",
    subsystem: "human_review",
    metric: "human_review_backlog",
    description: "Open human-review queue depth (operator backlog, not scoring).",
    unit: "count",
    window: "1h",
  },
];

/** In-memory operator-configured targets — never hard-code production values. */
const configuredTargets = new Map<string, number>();

export function listSloCandidates(): SloCandidate[] {
  return CANDIDATE_SEEDS.map((seed) => ({
    ...seed,
    target: configuredTargets.get(seed.id) ?? null,
  }));
}

export function configureSloTarget(
  candidateId: string,
  target: number | null,
): SloCandidate | null {
  const seed = CANDIDATE_SEEDS.find((c) => c.id === candidateId);
  if (!seed) return null;
  if (target === null) {
    configuredTargets.delete(candidateId);
  } else {
    if (!Number.isFinite(target) || target < 0) {
      throw new Error("slo_target_must_be_non_negative_finite");
    }
    configuredTargets.set(candidateId, target);
  }
  return {
    ...seed,
    target: configuredTargets.get(candidateId) ?? null,
  };
}

export function clearSloTargets(): void {
  configuredTargets.clear();
}

export function evaluateSloCandidate(
  candidate: SloCandidate,
  observed: number,
): "unconfigured" | "met" | "missed" {
  if (candidate.target === null) return "unconfigured";
  switch (candidate.metric) {
    case "availability":
      return observed >= candidate.target ? "met" : "missed";
    case "latency_p95_ms":
    case "failed_mission_planning_rate":
    case "blocked_action_rate":
    case "connector_degradation_rate":
    case "human_review_backlog":
      return observed <= candidate.target ? "met" : "missed";
    default: {
      const _exhaustive: never = candidate.metric;
      return _exhaustive;
    }
  }
}
