/**
 * Access Intelligence — Physical Systems domain (Harbour fictional twin).
 * Server-oriented core: configuration, safety, actions, adapters, simulator.
 */

import { resetAllAdapters } from "./adapters/registry";
import { resetMetrics } from "./observability";
import { resetPhysicalActionTransactionManager } from "./services/propose-action";
import { resetHarbourPhysicalSimulator } from "./simulator/harbour-simulator";

export type { PhysicalOperationalMode } from "./configuration";
export {
  getPhysicalMode,
  isLiveEnabled,
  isGlobalKillSwitchOn,
  isShadowOnly,
  canActuate,
  getPhysicalConfigurationSnapshot,
} from "./configuration";

export type { PhysicalSystemsErrorCode } from "./errors";
export {
  PhysicalSystemsError,
  isPhysicalSystemsError,
} from "./errors";

export {
  IMMUTABLE_PROHIBITED_ACTIONS,
  isProhibitedAction,
} from "./prohibited";
export type { ImmutableProhibitedAction } from "./prohibited";

export * from "./schemas";

export {
  listHarbourCapabilities,
  type HarbourCapabilityContext,
} from "./capabilities/harbour";

export { evaluateSafety, type SafetySnapshot } from "./safety/kernel";

export {
  createPhysicalActionProposal,
  hashProposal,
  stableStringify,
  type CreateProposalInput,
} from "./actions/proposal";

export {
  transitionAction,
  canTransition,
  getValidTransitions,
  type ActionTransitionEvent,
} from "./actions/state-machine";

export {
  PhysicalActionTransactionManager,
  type PhysicalActionStore,
  type TransactionContext,
} from "./actions/transaction";

export type {
  ExecuteCapabilityInput,
  ExecuteCapabilityResult,
  PhysicalDeviceAdapter,
  DeviceCondition as AdapterDeviceCondition,
  DeviceHealthState as AdapterDeviceHealthState,
  DeviceState as AdapterDeviceState,
} from "./adapters/types";
export { FICTIONAL_ADAPTER_NOTICE } from "./adapters/types";
export {
  getAdapterForCapability,
  getAdapterForDevice,
  listRegisteredAdapters,
  resetAllAdapters,
} from "./adapters/registry";
export { mockLiftWestAdapter, mockLiftMainAdapter } from "./adapters/mock-lift";
export { mockDoorAdapter } from "./adapters/mock-door";
export { mockRoomAdapter } from "./adapters/mock-room";
export { mockAssistanceAdapter } from "./adapters/mock-assistance";
export { mockRobotAdapter } from "./adapters/mock-robot";

export {
  HarbourPhysicalSimulator,
  getHarbourPhysicalSimulator,
  resetHarbourPhysicalSimulator,
  type HarbourSimulatorEvent,
  type HarbourSimulatorState,
} from "./simulator/harbour-simulator";

export {
  planPhysicalVisit,
  type PhysicalVisitJourney,
  type PlanPhysicalVisitResult,
} from "./services/plan-visit";
export {
  proposePhysicalAction,
  getPhysicalActionTransactionManager,
  resetPhysicalActionTransactionManager,
} from "./services/propose-action";
export { executeAuthorisedAction } from "./services/execute-action";

export {
  getScoutCandidates,
  listScoutFixtureIds,
} from "./scout/candidates";

export {
  recordMetric,
  getMetric,
  getAllMetrics,
  resetMetrics,
  type PhysicalMetricName,
} from "./observability";

/** Design token re-export for Physical Systems UI surfaces. */
export { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

/** Reset simulator, adapters, action manager, and metrics (tests / demo). */
export function resetPhysicalDomain(): void {
  resetHarbourPhysicalSimulator();
  resetAllAdapters();
  resetPhysicalActionTransactionManager();
  resetMetrics();
}
