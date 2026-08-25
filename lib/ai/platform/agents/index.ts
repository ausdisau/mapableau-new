export {
  MAPABLE_OPERATIONAL_AGENT_IDS,
} from "./types";
export type {
  MapAbleAgentId,
  MapAbleAgentManifest,
  MapAbleAgentActivationStatus,
  MapAbleAgentActivationMode,
  MapAbleAgentActor,
  MapAbleHumanReviewItem,
  MapAbleMissionContext,
  MapAbleAgentHandoff,
  MapAbleAgentActivationEntry,
  SelectMapAbleAgentsInput,
  SelectMapAbleAgentsResult,
} from "./types";

export { MAPABLE_AGENT_MANIFESTS } from "./manifests";

export {
  listMapAbleAgents,
  getMapAbleAgent,
  requireMapAbleAgent,
  listMapAbleAgentIds,
} from "./registry";

export {
  authorityCeilingToCareOsDisplayLabel,
  compareAuthorityCeiling,
  minAuthority,
  effectiveHandoffAuthority,
  assertHandoffDoesNotRaiseAuthority,
  agentExceedsCapabilityCeilings,
} from "./authority";

export {
  validateMapAbleAgentRegistry,
  assertMapAbleAgentRegistryValid,
  assertParticipantApprovalBinding,
  assertHandoffPreservesHumanOnly,
  isHumanOnlyWorkflow,
  resolveAgentEffectiveCeiling,
  getSeededAgentManifestCount,
} from "./validation";
export type {
  AgentRegistryValidationIssue,
  AgentRegistryValidationResult,
} from "./validation";

export { selectMapAbleAgents } from "./activation";

export {
  createMapAbleMissionContext,
  createMapAbleAgentHandoff,
  projectMissionContextForAgent,
} from "./mission";
