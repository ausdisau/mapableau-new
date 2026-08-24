import type { ContextType, FreshnessPolicy } from "./types";

/**
 * Deterministic per-type freshness policies.
 * No global fixed expiry — unknown age stays "unknown", never "missing".
 */
const POLICIES: Record<ContextType, FreshnessPolicy> = {
  participant_declared_preference: {
    contextType: "participant_declared_preference",
    currentMaxHours: 24 * 90,
    agingMaxHours: 24 * 180,
    staleMaxHours: 24 * 365,
    expireAfterHours: null,
  },
  participant_goal: {
    contextType: "participant_goal",
    currentMaxHours: 24 * 30,
    agingMaxHours: 24 * 90,
    staleMaxHours: 24 * 180,
    expireAfterHours: null,
  },
  mission_state: {
    contextType: "mission_state",
    currentMaxHours: 24,
    agingMaxHours: 72,
    staleMaxHours: 24 * 7,
    expireAfterHours: 24 * 30,
  },
  care_request_state: {
    contextType: "care_request_state",
    currentMaxHours: 12,
    agingMaxHours: 48,
    staleMaxHours: 24 * 7,
    expireAfterHours: 24 * 30,
  },
  transport_request_state: {
    contextType: "transport_request_state",
    currentMaxHours: 6,
    agingMaxHours: 24,
    staleMaxHours: 72,
    expireAfterHours: 24 * 14,
  },
  access_observation: {
    contextType: "access_observation",
    currentMaxHours: 24 * 30,
    agingMaxHours: 24 * 90,
    staleMaxHours: 24 * 180,
    expireAfterHours: 24 * 365,
  },
  access_barrier: {
    contextType: "access_barrier",
    currentMaxHours: 24 * 7,
    agingMaxHours: 24 * 30,
    staleMaxHours: 24 * 90,
    expireAfterHours: 24 * 180,
  },
  venue_feature: {
    contextType: "venue_feature",
    currentMaxHours: 24 * 90,
    agingMaxHours: 24 * 180,
    staleMaxHours: 24 * 365,
    expireAfterHours: null,
  },
  job_event: {
    contextType: "job_event",
    currentMaxHours: 24,
    agingMaxHours: 72,
    staleMaxHours: 24 * 14,
    expireAfterHours: 24 * 90,
  },
  workplace_requirement: {
    contextType: "workplace_requirement",
    currentMaxHours: 24 * 30,
    agingMaxHours: 24 * 90,
    staleMaxHours: 24 * 180,
    expireAfterHours: null,
  },
  provider_availability: {
    contextType: "provider_availability",
    currentMaxHours: 6,
    agingMaxHours: 24,
    staleMaxHours: 72,
    expireAfterHours: 24 * 7,
  },
  worker_availability: {
    contextType: "worker_availability",
    currentMaxHours: 6,
    agingMaxHours: 24,
    staleMaxHours: 72,
    expireAfterHours: 24 * 7,
  },
  appointment: {
    contextType: "appointment",
    currentMaxHours: 24,
    agingMaxHours: 72,
    staleMaxHours: 24 * 14,
    expireAfterHours: 24 * 90,
  },
  calendar_event: {
    contextType: "calendar_event",
    currentMaxHours: 24,
    agingMaxHours: 72,
    staleMaxHours: 24 * 14,
    expireAfterHours: 24 * 90,
  },
  action_result: {
    contextType: "action_result",
    currentMaxHours: 24 * 7,
    agingMaxHours: 24 * 30,
    staleMaxHours: 24 * 90,
    expireAfterHours: null,
  },
  human_review_state: {
    contextType: "human_review_state",
    currentMaxHours: 24,
    agingMaxHours: 72,
    staleMaxHours: 24 * 14,
    expireAfterHours: null,
  },
  service_outage: {
    contextType: "service_outage",
    currentMaxHours: 1,
    agingMaxHours: 6,
    staleMaxHours: 24,
    expireAfterHours: 72,
  },
  feature_state: {
    contextType: "feature_state",
    currentMaxHours: 24,
    agingMaxHours: 24 * 7,
    staleMaxHours: 24 * 30,
    expireAfterHours: null,
  },
};

export function getFreshnessPolicy(contextType: ContextType): FreshnessPolicy {
  return POLICIES[contextType];
}

export function listContextTypePolicies(): FreshnessPolicy[] {
  return Object.values(POLICIES);
}

/** Context types that may legally carry model_inference source trust. */
export const INFERENCE_ALLOWED_TYPES: ReadonlySet<ContextType> = new Set([
  "mission_state",
  "human_review_state",
  "feature_state",
]);

/** Domains that may route into Adaptive Recovery when mission-linked. */
export const RECOVERY_RELEVANT_EVENT_TYPES = new Set([
  "transport.unavailable",
  "care.request_state_changed",
  "access.observation_changed",
  "access.barrier_reported",
  "provider.availability_changed",
  "worker.availability_changed",
  "consent.revoked",
  "goal.changed",
  "action.result",
  "service.outage",
  "human_review.state_changed",
]);
