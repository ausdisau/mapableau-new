/**
 * MapAble AURA feature flags (Wave 1–5).
 * Authority / safety flags are server-only — never NEXT_PUBLIC.
 */

function envTrue(name: string): boolean {
  const v = process.env[name];
  return v === "true" || v === "1";
}

function envFalse(name: string): boolean {
  const v = process.env[name];
  return v === "false" || v === "0";
}

export const auraFlags = {
  enabled: envTrue("MAPABLE_AURA_ENABLED"),
  modelReasoning: !envFalse("MAPABLE_AURA_MODEL_REASONING_ENABLED"),
  counterfactuals: !envFalse("MAPABLE_AURA_COUNTERFACTUALS_ENABLED"),
  resilience: !envFalse("MAPABLE_AURA_RESILIENCE_ENABLED"),
  planChallenge: !envFalse("MAPABLE_AURA_PLAN_CHALLENGE_ENABLED"),
  auditReplay: !envFalse("MAPABLE_AURA_AUDIT_REPLAY_ENABLED"),
  offlinePacks: !envFalse("MAPABLE_AURA_OFFLINE_PACKS_ENABLED"),
  /** Wave 3 — proposals / shadow (opt-in) */
  proposals: envTrue("MAPABLE_AURA_PROPOSALS_ENABLED"),
  proposalReview: envTrue("MAPABLE_AURA_PROPOSAL_REVIEW_ENABLED"),
  shadowEvaluation: envTrue("MAPABLE_AURA_SHADOW_EVALUATION_ENABLED"),
  /** Legacy — must remain false; use per-action Wave 4 flags */
  writeExecution: envTrue("MAPABLE_AURA_WRITE_EXECUTION_ENABLED"),
  externalDelivery: envTrue("MAPABLE_AURA_EXTERNAL_DELIVERY_ENABLED"),
  /** Wave 4 */
  executionMode: process.env.MAPABLE_AURA_EXECUTION_MODE ?? "shadow",
  executeVenueVerification: envTrue("MAPABLE_AURA_EXECUTE_VENUE_VERIFICATION"),
  executeVisitPlanShare: envTrue("MAPABLE_AURA_EXECUTE_VISIT_PLAN_SHARE"),
  executeSupporterNotification: envTrue("MAPABLE_AURA_EXECUTE_SUPPORTER_NOTIFICATION"),
  executeTransportRequest: envTrue("MAPABLE_AURA_EXECUTE_TRANSPORT_REQUEST"),
  executeBarrierReport: envTrue("MAPABLE_AURA_EXECUTE_BARRIER_REPORT"),
  /** Wave 5 — default off */
  memory: envTrue("MAPABLE_AURA_MEMORY_ENABLED"),
  memorySuggestions: envTrue("MAPABLE_AURA_MEMORY_SUGGESTIONS_ENABLED"),
  outcomeCalibration: envTrue("MAPABLE_AURA_OUTCOME_CALIBRATION_ENABLED"),
  evidenceCorrections: envTrue("MAPABLE_AURA_EVIDENCE_CORRECTIONS_ENABLED"),
  reliabilityCalibration: envTrue("MAPABLE_AURA_RELIABILITY_CALIBRATION_ENABLED"),
  /** Wave 6 — Pocket / offline / multimodal (default off) */
  pocketEnabled: envTrue("MAPABLE_AURA_POCKET_ENABLED"),
  offlineRuntimeEnabled: envTrue("MAPABLE_AURA_OFFLINE_RUNTIME_ENABLED"),
  onDeviceAiEnabled: envTrue("MAPABLE_AURA_ON_DEVICE_AI_ENABLED"),
  multimodalEnabled: envTrue("MAPABLE_AURA_MULTIMODAL_ENABLED"),
  spatialLensEnabled: envTrue("MAPABLE_AURA_SPATIAL_LENS_ENABLED"),
  adaptiveCommunicationEnabled: envTrue("MAPABLE_AURA_ADAPTIVE_COMMUNICATION_ENABLED"),
  waiAdaptEnabled: envTrue("MAPABLE_AURA_WAI_ADAPT_ENABLED"),
  nativeBridgesEnabled: envTrue("MAPABLE_AURA_NATIVE_BRIDGES_ENABLED"),
  /** Wave 7 — world model / interoperability (default off; gated behind Wave 6) */
  worldModelEnabled: envTrue("MAPABLE_AURA_WORLD_MODEL_ENABLED"),
  gtfsImportEnabled: envTrue("MAPABLE_AURA_GTFS_IMPORT_ENABLED"),
  gtfsRealtimeEnabled: envTrue("MAPABLE_AURA_GTFS_REALTIME_ENABLED"),
  indoorgmlImportEnabled: envTrue("MAPABLE_AURA_INDOORGML_IMPORT_ENABLED"),
  curbEnabled: envTrue("MAPABLE_AURA_CURB_ENABLED"),
  sensorThingsEnabled: envTrue("MAPABLE_AURA_SENSORTHINGS_ENABLED"),
  wotRegistryEnabled: envTrue("MAPABLE_AURA_WOT_REGISTRY_ENABLED"),
  journeyGuardianEnabled: envTrue("MAPABLE_AURA_JOURNEY_GUARDIAN_ENABLED"),
  wotActionsEnabled: envTrue("MAPABLE_AURA_WOT_ACTIONS_ENABLED"),
  sensorThingsTaskingEnabled: envTrue("MAPABLE_AURA_SENSORTHINGS_TASKING_ENABLED"),
  /** Wave 8 — portable trust (default off; gated behind Wave 7) */
  credentialWalletEnabled: envTrue("MAPABLE_AURA_CREDENTIAL_WALLET_ENABLED"),
  accessCapsulesEnabled: envTrue("MAPABLE_AURA_ACCESS_CAPSULES_ENABLED"),
  selectiveDisclosureEnabled: envTrue("MAPABLE_AURA_SELECTIVE_DISCLOSURE_ENABLED"),
  agentCoordinationEnabled: envTrue("MAPABLE_AURA_AGENT_COORDINATION_ENABLED"),
  humanAssistanceMeshEnabled: envTrue("MAPABLE_AURA_HUMAN_ASSISTANCE_MESH_ENABLED"),
  /** Wave 9 — reliability / civic / regional (default off; gated behind Wave 8) */
  accessReliabilityEnabled: envTrue("MAPABLE_ACCESS_RELIABILITY_ENABLED"),
  serviceCommitmentsEnabled: envTrue("MAPABLE_ACCESS_SERVICE_COMMITMENTS_ENABLED"),
  civicAccessTwinEnabled: envTrue("MAPABLE_CIVIC_ACCESS_TWIN_ENABLED"),
  regionalAccessTwinEnabled: envTrue("MAPABLE_REGIONAL_ACCESS_TWIN_ENABLED"),
  infrastructureSimulatorEnabled: envTrue("MAPABLE_INFRASTRUCTURE_SIMULATOR_ENABLED"),
  predictiveGuardianEnabled: envTrue("MAPABLE_AURA_PREDICTIVE_GUARDIAN_ENABLED"),
  /** Wave 10 — supervised adaptive environments (default off; gated behind Wave 9) */
  adaptiveEnvironmentEnabled: envTrue("MAPABLE_AURA_ADAPTIVE_ENVIRONMENT_ENABLED"),
  physicalMode: (process.env.MAPABLE_AURA_PHYSICAL_MODE ?? "demo") as
    | "demo"
    | "shadow"
    | "supervised_pilot"
    | "production",
  supervisedActionsEnabled: envTrue("MAPABLE_AURA_SUPERVISED_ACTIONS_ENABLED"),
  telepresenceEnabled: envTrue("MAPABLE_AURA_TELEPRESENCE_ENABLED"),
  robotSimulationEnabled: envTrue("MAPABLE_AURA_ROBOT_SIMULATION_ENABLED"),
  robotLiveEnabled: envTrue("MAPABLE_AURA_ROBOT_LIVE_ENABLED"),
  /** Permanent prohibitions */
  physicalActions: envTrue("MAPABLE_AURA_PHYSICAL_ACTIONS_ENABLED"),
  paymentActions: envTrue("MAPABLE_AURA_PAYMENT_ACTIONS_ENABLED"),
  claimActions: envTrue("MAPABLE_AURA_CLAIM_ACTIONS_ENABLED"),
  clinicalActions: envTrue("MAPABLE_AURA_CLINICAL_ACTIONS_ENABLED"),
  usePrisma: envTrue("MAPABLE_AURA_USE_PRISMA"),
  globalAiEnabled: !envFalse("MAPABLE_AI_ENABLED"),
  globalAiAudit: !envFalse("MAPABLE_AI_AUDIT_ENABLED"),
  globalAiWriteActions: envTrue("MAPABLE_AI_WRITE_ACTIONS"),
} as const;

export type AuraFlagKey = keyof typeof auraFlags;

export function listAuraFlagStates(): Record<AuraFlagKey, boolean> {
  const out = {} as Record<AuraFlagKey, boolean>;
  for (const key of Object.keys(auraFlags) as AuraFlagKey[]) {
    out[key] = Boolean(auraFlags[key]);
  }
  return out;
}

/**
 * Wave 3 ceiling is L3_PROPOSE when proposals are enabled (or in test/demo).
 * Execution levels remain unreachable.
 */
export function auraMaxAuthorityLevel(): "L2_RECOMMEND" | "L3_PROPOSE" {
  if (
    auraFlags.proposals ||
    process.env.NODE_ENV === "test" ||
    process.env.MAPABLE_AURA_DEMO === "true"
  ) {
    return "L3_PROPOSE";
  }
  return "L2_RECOMMEND";
}

/**
 * Stop AURA is mandatory whenever AURA is enabled.
 * Wave 3 also fails closed if execution flags are unexpectedly true while proposing.
 */
export function assertAuraCanStart(): void {
  if (
    !auraFlags.enabled &&
    process.env.MAPABLE_AURA_DEMO !== "true" &&
    process.env.NODE_ENV !== "test"
  ) {
    throw new Error("MAPABLE_AURA_DISABLED");
  }
  if (
    !auraFlags.globalAiEnabled &&
    process.env.MAPABLE_AURA_DEMO !== "true" &&
    process.env.NODE_ENV !== "test"
  ) {
    throw new Error("MAPABLE_AI_DISABLED");
  }
  if (typeof AbortController === "undefined") {
    throw new Error("AURA_STOP_UNAVAILABLE");
  }
}
