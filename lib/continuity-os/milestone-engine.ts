import { getLifeEventType } from "@/lib/continuity-os/taxonomy";
import type {
  ContinuityHorizon,
  MilestoneStatus,
} from "@/lib/continuity-os/types";
import type { DependencyProjection } from "@/lib/continuity-os/dependency-projection";

export interface MilestoneView {
  key: string;
  label: string;
  horizon: ContinuityHorizon;
  ownerRole: string;
  status: MilestoneStatus;
  requiredDependencyKeys: string[];
  missingDependencies: string[];
  evidenceRequired: boolean;
  canModelDeclareComplete: false;
  fallback?: string;
  escalation?: string;
}

/**
 * Build milestone views from templates + dependency projection.
 * A model cannot declare completion — evidenceRequired is always true for completed.
 */
export function buildMilestoneViews(params: {
  typeKey: string;
  typeVersion: string;
  projection: DependencyProjection;
  completedKeys?: string[];
  blockedKeys?: string[];
}): MilestoneView[] {
  const def = getLifeEventType(params.typeKey, params.typeVersion);
  if (!def) return [];

  const completed = new Set(params.completedKeys ?? []);
  const blocked = new Set(params.blockedKeys ?? []);
  const stateByKey = new Map(
    params.projection.nodes.map((n) => [n.id, n.state])
  );

  return def.milestones.map((m) => {
    const missing = m.requiredDependencyKeys.filter((key) => {
      const state = stateByKey.get(key);
      return state !== "confirmed" && state !== "restored";
    });

    let status: MilestoneStatus = "pending";
    if (completed.has(m.key)) {
      status = "completed";
    } else if (blocked.has(m.key) || missing.some((k) => stateByKey.get(k) === "failed")) {
      status = "blocked";
    } else if (missing.length === 0) {
      status = "ready";
    } else if (missing.some((k) => stateByKey.get(k) === "unknown")) {
      status = "unknown";
    }

    return {
      key: m.key,
      label: m.label,
      horizon: m.horizon,
      ownerRole: m.ownerRole,
      status,
      requiredDependencyKeys: m.requiredDependencyKeys,
      missingDependencies: missing,
      evidenceRequired: true,
      canModelDeclareComplete: false,
      fallback:
        missing.length > 0
          ? "Confirm missing dependencies or escalate to a human coordinator"
          : undefined,
      escalation:
        status === "blocked" ? "human_coordinator" : undefined,
    };
  });
}
