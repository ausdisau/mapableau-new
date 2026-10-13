/**
 * Participant Agency Memory + Preference Graph (Prompt 05).
 *
 * Canonical ownership:
 * - Agency Memory (`lib/ai/platform/agency-memory/`) — long-term participant-controlled
 *   preference/decision graph for Mission Runtime / Context Fabric personalisation.
 * - CareOSParticipantPreference — operational CareOS keys; Action Kernel
 *   `save_participant_preference` dual-writes via Agency Memory bridge.
 * - AccessibilityProfile — operational access passport SoT (not replaced).
 * - Navigator Memory — separate pilot surface (not merged).
 * - LifeIntent — goals SoT; mission_preference / PURSUES may reference intent IDs.
 * - Context Fabric — perception/event bus; Agency Memory supplies scoped preference slices.
 *
 * Persistence: in-memory (Prompt 01–04 pattern). Prompt 05A if Prisma required.
 */

export type {
  AgencyMemoryCategory,
  AgencyMemoryControls,
  AgencyMemoryExportBundle,
  AgencyMemoryScopedQuery,
  MapAbleAgencyMemoryItem,
  MemoryConfirmationState,
  MemoryConflict,
  MemorySource,
  MemoryVisibility,
  PreferenceGraph,
  PreferenceGraphEdge,
  PreferenceGraphEdgeType,
  PreferenceGraphNode,
  ProhibitedMemoryCategory,
} from "./types";

export {
  AGENCY_MEMORY_CATEGORIES,
  MEMORY_CONFIRMATION_STATES,
  MEMORY_SOURCES,
  MEMORY_VISIBILITY,
  NON_CONFIRMING_SOURCES,
  PREFERENCE_GRAPH_EDGE_TYPES,
  PROHIBITED_MEMORY_CATEGORIES,
} from "./types";

export {
  agencyMemoryCategorySchema,
  confirmMemoryInputSchema,
  controlsUpdateSchema,
  deleteMemoryInputSchema,
  editMemoryInputSchema,
  proposeMemoryInputSchema,
  revokeMemoryInputSchema,
  scopedRetrievalSchema,
} from "./schemas";

export {
  assertGovernedCategory,
  CAREOS_KEY_TO_CATEGORY,
  CATEGORY_REGISTRY,
  getCategoryEntry,
  isGovernedCategory,
  isProhibitedCategory,
} from "./registry";

export {
  clearAgencyMemoryStore,
  debugCountAllItems,
  getAuditVersions,
  getControls,
  getMemoryItem,
  listMemoryItems,
} from "./store";

export {
  getActivePreferenceGraph,
  inferEdgesFromCorrelation,
  rebuildPreferenceGraph,
} from "./graph";

export {
  detectConflicts,
  resolveConflictPreferringRecent,
} from "./conflicts";

export {
  assertCannotPersistInferenceAsConfirmed,
  categoryPlainLanguage,
  confirmMemory,
  deleteMemory,
  editMemory,
  expireStaleMemory,
  proposeMemory,
  revokeMemory,
  updateControls,
} from "./confirm";

export {
  assessDelegateMemoryWrite,
  assertDelegateMayNotExceedAuthority,
} from "./delegates";

export {
  communicationPreferenceValue,
  filterByPurpose,
  listUsableForPersonalisation,
  providerExclusionRespected,
} from "./scope";

export { formatAgencyMemoryForParticipant } from "./presentation";
export { exportAgencyMemory } from "./export";

export {
  getAgencyMemorySnapshot,
  retrieveScopedMemory,
  savePreferenceViaAgencyMemory,
} from "./service";
