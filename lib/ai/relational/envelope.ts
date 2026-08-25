import { getAiCapability } from "@/lib/ai/platform/capabilities/registry";
import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";
import { buildRelationalDenialState } from "@/lib/ai/relational/denial-ux";
import {
  RELATIONAL_POLICY_VERSION,
  isRelationalCapabilityKey,
  type RelationalDenialState,
  type RelationalGovernedEnvelope,
} from "@/lib/ai/relational/types";

const ESCALATING_CEILINGS = new Set<string>([
  "DETERMINISTIC_EXECUTE_VIA_SERVICE",
  "NO_OPERATIONAL_AUTHORITY",
]);

export type EnvelopeValidationResult =
  | {
      ok: true;
      envelope: {
        capabilityKey: string;
        tenantId: string;
        participantId: string;
        actorUserId: string;
        purpose: string;
        consentScopes: string[];
        correlationId?: string;
        policyVersion: typeof RELATIONAL_POLICY_VERSION;
        authorityCeiling: AuthorityCeiling;
      };
      authorityCeiling: AuthorityCeiling;
    }
  | {
      ok: false;
      denial: RelationalDenialState;
    };

/**
 * Validate a governed-action envelope before capability gates.
 * Rejects model/client-supplied authority escalation.
 */
export function validateRelationalGovernedEnvelope(
  input: RelationalGovernedEnvelope,
): EnvelopeValidationResult {
  if (
    !input.capabilityKey?.trim() ||
    !input.tenantId?.trim() ||
    !input.participantId?.trim() ||
    !input.actorUserId?.trim() ||
    !input.purpose?.trim()
  ) {
    return { ok: false, denial: buildRelationalDenialState("envelope_invalid") };
  }

  if (
    input.modelSuppliedAuthority != null ||
    input.modelSuppliedTools != null ||
    input.modelSuppliedTenant != null
  ) {
    return {
      ok: false,
      denial: buildRelationalDenialState("model_authority_rejected"),
    };
  }

  if (
    typeof input.claimedAuthorityCeiling === "string" &&
    ESCALATING_CEILINGS.has(input.claimedAuthorityCeiling)
  ) {
    return {
      ok: false,
      denial: buildRelationalDenialState("model_authority_rejected"),
    };
  }

  if (!isRelationalCapabilityKey(input.capabilityKey)) {
    return {
      ok: false,
      denial: buildRelationalDenialState("not_relational_capability"),
    };
  }

  const capability = getAiCapability(input.capabilityKey);
  if (!capability) {
    return {
      ok: false,
      denial: buildRelationalDenialState("capability_not_registered"),
    };
  }

  if (
    input.claimedTools?.some(
      (tool) => !capability.toolAllowlist.includes(tool),
    )
  ) {
    return {
      ok: false,
      denial: buildRelationalDenialState("tool_not_allowlisted"),
    };
  }

  return {
    ok: true,
    authorityCeiling: capability.authorityCeiling,
    envelope: {
      capabilityKey: input.capabilityKey,
      tenantId: input.tenantId,
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      purpose: input.purpose,
      consentScopes: input.consentScopes,
      correlationId: input.correlationId,
      policyVersion: RELATIONAL_POLICY_VERSION,
      authorityCeiling: capability.authorityCeiling,
    },
  };
}
