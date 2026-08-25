import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";

export const RELATIONAL_POLICY_VERSION = "relational-intelligence.v1" as const;

export const RELATIONAL_CAPABILITY_KEYS = [
  "relational.interpret",
  "relational.clarify",
  "relational.explain",
  "relational.draft",
  "access.search.read",
  "human.help.request",
] as const;

export type RelationalCapabilityKey = (typeof RELATIONAL_CAPABILITY_KEYS)[number];

export function isRelationalCapabilityKey(
  key: string,
): key is RelationalCapabilityKey {
  return (RELATIONAL_CAPABILITY_KEYS as readonly string[]).includes(key);
}

export type RelationalDenialCode =
  | "capability_not_registered"
  | "feature_flag_disabled"
  | "global_kill_switch"
  | "relational_kill_switch"
  | "capability_kill_switch"
  | "authority_exceeded"
  | "tool_not_allowlisted"
  | "tenant_mismatch"
  | "participant_mismatch"
  | "consent_missing_or_wrong_purpose"
  | "model_authority_rejected"
  | "prohibited_operational_capability"
  | "prohibited_inference"
  | "envelope_invalid"
  | "not_relational_capability";

export type RelationalDenialState = {
  code: RelationalDenialCode;
  title: string;
  message: string;
  nextStep: string;
};

export type RelationalGateContext = {
  capabilityKey: string;
  tenantId: string;
  expectedTenantId: string;
  participantId: string;
  expectedParticipantId: string;
  actorUserId: string;
  grantedConsentScopes: string[];
  toolName?: string;
  correlationId?: string;
  /** Skip audit writes (tests). */
  silent?: boolean;
};

export type RelationalGateAllow = {
  allowed: true;
  capabilityKey: RelationalCapabilityKey;
  authorityCeiling: AuthorityCeiling;
  policyVersion: typeof RELATIONAL_POLICY_VERSION;
  correlationId?: string;
};

export type RelationalGateDeny = {
  allowed: false;
  reason: RelationalDenialCode;
  denial: RelationalDenialState;
  capabilityKey?: string;
  policyVersion: typeof RELATIONAL_POLICY_VERSION;
  correlationId?: string;
};

export type RelationalGateResult = RelationalGateAllow | RelationalGateDeny;

export type RelationalGovernedEnvelope = {
  capabilityKey: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  purpose: string;
  consentScopes: string[];
  correlationId?: string;
  /** Client/model-supplied policy version is ignored. */
  policyVersion?: string;
  claimedAuthorityCeiling?: AuthorityCeiling | string;
  claimedTools?: string[];
  modelSuppliedAuthority?: unknown;
  modelSuppliedTools?: unknown;
  modelSuppliedTenant?: unknown;
};
