import { getLifeEventType } from "@/lib/continuity-os/taxonomy";
import type {
  DependencyState,
  LifeEventDependencyEdge,
  LifeEventDependencyNode,
  ResponsibilityMap,
} from "@/lib/continuity-os/types";

export interface DependencyProjectionInput {
  typeKey: string;
  typeVersion: string;
  /** Participant-selected hard requirement keys that must remain visible. */
  hardRequirementKeys?: string[];
  /** Override states keyed by dependency template key. */
  stateOverrides?: Record<string, DependencyState>;
  /** Explicit unknowns that must be preserved (e.g. reception_assistance). */
  preservedUnknowns?: string[];
  /** Optional CareOS graphJson fragment for future merge. */
  careOsGraphJson?: {
    nodes?: Array<{ id: string; status?: string; label?: string }>;
    edges?: Array<{
      id?: string;
      from?: string;
      to?: string;
      relationship?: string;
    }>;
  } | null;
}

export interface DependencyProjection {
  missionTypeKey: string;
  typeVersion: string;
  nodes: LifeEventDependencyNode[];
  edges: LifeEventDependencyEdge[];
  singlePointsOfFailure: string[];
  unknowns: string[];
  blockers: string[];
  responsibilitySummary: Array<{
    dependencyKey: string;
    label: string;
    responsibility: ResponsibilityMap;
  }>;
}

function defaultStateForDependency(required: boolean): DependencyState {
  return required ? "unconfirmed" : "unknown";
}

/**
 * Read-only dependency projection from life-event templates + optional CareOS graph.
 * Does not write operational records. Preserves unknowns and blockers.
 */
export function projectLifeEventDependencies(
  input: DependencyProjectionInput
): DependencyProjection {
  const def = getLifeEventType(input.typeKey, input.typeVersion);
  if (!def) {
    throw new Error(
      `Cannot project dependencies for unknown type ${input.typeKey}@${input.typeVersion}`
    );
  }

  const preserved = new Set(input.preservedUnknowns ?? []);
  const overrides = input.stateOverrides ?? {};
  const hard = new Set(input.hardRequirementKeys ?? []);

  const nodes: LifeEventDependencyNode[] = def.dependencies.map((dep) => {
    let state = overrides[dep.key] ?? defaultStateForDependency(dep.required);
    if (preserved.has(dep.key)) {
      state = "unknown";
    }

    // Prefer CareOS node status when present (shadow dual-read).
    const careNode = input.careOsGraphJson?.nodes?.find(
      (n) => n.id === dep.key || n.id === `mission-${dep.key}`
    );
    if (careNode?.status === "missing" || careNode?.status === "needs_review") {
      state = dep.required ? "unconfirmed" : "unknown";
    }
    if (careNode?.status === "confirmed") {
      state = "confirmed";
    }

    return {
      id: dep.key,
      nodeType: dep.nodeType,
      label: dep.label,
      state,
      required: dep.required || hard.has(dep.key),
      owner: dep.ownerRole,
      responsibility: dep.responsibility,
      alternativeIds: [],
      failureImpact: dep.failureImpact,
      unknownReason:
        state === "unknown"
          ? preserved.has(dep.key)
            ? "Preserved as unknown until confirmed"
            : "Not yet confirmed"
          : undefined,
      source: "life_event_template_v1",
    };
  });

  const edges: LifeEventDependencyEdge[] = [];
  for (const milestone of def.milestones) {
    for (const depKey of milestone.requiredDependencyKeys) {
      edges.push({
        id: `${depKey}->milestone:${milestone.key}`,
        fromId: depKey,
        toId: `milestone:${milestone.key}`,
        edgeType: "requires",
        label: `${depKey} required for ${milestone.label}`,
      });
    }
  }

  // Timing chain for start_job pilot: support → transport → arrival
  if (def.typeKey === "start_job") {
    edges.push(
      {
        id: "morning_support_worker->accessible_transport",
        fromId: "morning_support_worker",
        toId: "accessible_transport",
        edgeType: "must_arrive_before",
        label: "Support departure must precede transport pickup",
      },
      {
        id: "accessible_transport->arrival_before_845",
        fromId: "accessible_transport",
        toId: "arrival_before_845",
        edgeType: "must_arrive_before",
        label: "Transport must deliver before arrival deadline",
      }
    );
  }

  const singlePointsOfFailure = def.dependencies
    .filter((d) => d.singlePointOfFailureHint)
    .map((d) => d.key);

  const unknowns = nodes
    .filter((n) => n.state === "unknown" || n.state === "unconfirmed")
    .map((n) => n.id);

  const blockers = nodes
    .filter((n) => n.required && (n.state === "failed" || n.state === "stale"))
    .map((n) => n.id);

  return {
    missionTypeKey: def.typeKey,
    typeVersion: def.version,
    nodes,
    edges,
    singlePointsOfFailure,
    unknowns,
    blockers,
    responsibilitySummary: nodes.map((n) => ({
      dependencyKey: n.id,
      label: n.label,
      responsibility: n.responsibility,
    })),
  };
}
