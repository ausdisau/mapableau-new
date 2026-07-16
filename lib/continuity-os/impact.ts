import type { DependencyProjection } from "@/lib/continuity-os/dependency-projection";
import { projectLifeEventDependencies } from "@/lib/continuity-os/dependency-projection";
import type { DependencyState } from "@/lib/continuity-os/types";

export interface ImpactVersion {
  version: number;
  failedDependencyId: string;
  priorPlanPreserved: true;
  directlyAffected: string[];
  secondaryAffected: string[];
  timingImpact: string[];
  accessibilityImpact: string[];
  disclosureImpact: string[];
  financialImpact: string[];
  affectedMilestones: string[];
  authorisedNoticeCandidates: string[];
  potentialAlternativeHints: string[];
  requiresParticipantReview: true;
  /** Prior projection snapshot — immutable reference for audit. */
  priorProjectionSnapshot: DependencyProjection;
  /** New projection with failed dependency marked. */
  impactProjection: DependencyProjection;
}

/**
 * Propagate failure impact while preserving the previous mission plan.
 * No automatic actions are taken.
 */
export function calculateFailureImpact(params: {
  typeKey: string;
  typeVersion: string;
  failedDependencyId: string;
  priorProjection: DependencyProjection;
  version?: number;
  hardRequirementKeys?: string[];
  preservedUnknowns?: string[];
}): ImpactVersion {
  const overrides: Record<string, DependencyState> = {};
  for (const node of params.priorProjection.nodes) {
    overrides[node.id] = node.state;
  }
  overrides[params.failedDependencyId] = "failed";

  const impactProjection = projectLifeEventDependencies({
    typeKey: params.typeKey,
    typeVersion: params.typeVersion,
    stateOverrides: overrides,
    hardRequirementKeys: params.hardRequirementKeys,
    preservedUnknowns: params.preservedUnknowns,
  });

  const directlyAffected = params.priorProjection.edges
    .filter((e) => e.fromId === params.failedDependencyId)
    .map((e) => e.toId);

  const secondaryAffected = params.priorProjection.edges
    .filter((e) => directlyAffected.includes(e.fromId))
    .map((e) => e.toId);

  const timingImpact: string[] = [];
  const accessibilityImpact: string[] = [];
  if (params.failedDependencyId === "accessible_transport") {
    timingImpact.push("arrival_before_845 at risk");
    timingImpact.push("job start may be missed");
    accessibilityImpact.push(
      "Replacement vehicle must meet hard access requirements before availability"
    );
  }
  if (params.failedDependencyId === "morning_support_worker") {
    timingImpact.push("departure time at risk");
    timingImpact.push("transport pickup may be missed");
  }
  if (params.failedDependencyId === "western_lift") {
    accessibilityImpact.push("Route may become staff-dependent");
  }

  const affectedMilestones = params.priorProjection.edges
    .filter(
      (e) =>
        e.toId.startsWith("milestone:") &&
        (e.fromId === params.failedDependencyId ||
          directlyAffected.includes(e.fromId))
    )
    .map((e) => e.toId.replace("milestone:", ""));

  return {
    version: params.version ?? 1,
    failedDependencyId: params.failedDependencyId,
    priorPlanPreserved: true,
    directlyAffected,
    secondaryAffected,
    timingImpact,
    accessibilityImpact,
    disclosureImpact: [
      "Employer or provider notice requires separate participant approval",
    ],
    financialImpact: [
      "Additional transport cost must be shown before any recovery option is selected",
    ],
    affectedMilestones,
    authorisedNoticeCandidates: [
      "transport_coordinator",
      "provider_manager",
      "jobs_navigator",
    ],
    potentialAlternativeHints: [
      "verified accessible replacement",
      "move appointment",
      "human transport coordination",
    ],
    requiresParticipantReview: true,
    priorProjectionSnapshot: params.priorProjection,
    impactProjection,
  };
}
