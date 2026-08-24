import type { MapAbleModule } from "@/intelligence/types";
import type { ProposalApprovalBinding } from "@/lib/ai/platform/human-review/contracts";
import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";

import { effectiveHandoffAuthority } from "./authority";
import { requireMapAbleAgent } from "./registry";
import type {
  MapAbleAgentActor,
  MapAbleAgentHandoff,
  MapAbleAgentId,
  MapAbleHumanReviewItem,
  MapAbleMissionContext,
} from "./types";

export function createMapAbleMissionContext(input: {
  missionId: string;
  actor: MapAbleAgentActor;
  participantId: string | null;
  objective: string;
  domains: MapAbleModule[];
  consentScopes?: string[];
  communicationPreferences?: string[];
  evidenceRefs?: string[];
  activeAgentIds: MapAbleAgentId[];
  authorityCeiling: AuthorityCeiling;
  approvalBindings?: ProposalApprovalBinding[];
  featureFlags?: Record<string, boolean>;
  humanReviewItems?: MapAbleHumanReviewItem[];
  traceId: string;
}): MapAbleMissionContext {
  return {
    missionId: input.missionId,
    actor: input.actor,
    participantId: input.participantId,
    objective: input.objective,
    domains: input.domains,
    consentScopes: input.consentScopes ?? [],
    communicationPreferences: input.communicationPreferences ?? [],
    evidenceRefs: input.evidenceRefs ?? [],
    activeAgentIds: input.activeAgentIds,
    authorityCeiling: input.authorityCeiling,
    approvalBindings: input.approvalBindings ?? [],
    featureFlags: input.featureFlags ?? {},
    humanReviewItems: input.humanReviewItems ?? [],
    traceId: input.traceId,
  };
}

/**
 * Build a typed handoff. Authority cannot increase above the mission ceiling
 * or either agent/capability ceiling.
 */
export function createMapAbleAgentHandoff(input: {
  mission: MapAbleMissionContext;
  fromAgent: MapAbleAgentId;
  toAgent: MapAbleAgentId;
  minimumContext?: Record<string, string | number | boolean | null>;
  unresolvedQuestions?: string[];
  capabilityKey?: string;
}): MapAbleAgentHandoff {
  requireMapAbleAgent(input.fromAgent);
  requireMapAbleAgent(input.toAgent);

  const authorityCeiling = effectiveHandoffAuthority({
    missionAuthority: input.mission.authorityCeiling,
    sourceAgentId: input.fromAgent,
    targetAgentId: input.toAgent,
    capabilityKey: input.capabilityKey,
  });

  return {
    missionId: input.mission.missionId,
    approvedObjective: input.mission.objective,
    fromAgent: input.fromAgent,
    toAgent: input.toAgent,
    minimumContext: input.minimumContext ?? {},
    evidenceRefs: [...input.mission.evidenceRefs],
    consentScopes: [...input.mission.consentScopes],
    unresolvedQuestions: input.unresolvedQuestions ?? [],
    authorityCeiling,
    traceId: input.mission.traceId,
  };
}

/** Minimum necessary projection of mission context for a specialist agent. */
export function projectMissionContextForAgent(
  mission: MapAbleMissionContext,
  agentId: MapAbleAgentId
): Pick<
  MapAbleMissionContext,
  | "missionId"
  | "actor"
  | "participantId"
  | "objective"
  | "domains"
  | "consentScopes"
  | "evidenceRefs"
  | "authorityCeiling"
  | "traceId"
> & { agentId: MapAbleAgentId } {
  return {
    missionId: mission.missionId,
    actor: mission.actor,
    participantId: mission.participantId,
    objective: mission.objective,
    domains: mission.domains,
    consentScopes: mission.consentScopes,
    evidenceRefs: mission.evidenceRefs,
    authorityCeiling: mission.authorityCeiling,
    traceId: mission.traceId,
    agentId,
  };
}
