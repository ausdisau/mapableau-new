import { verificationForSourceTrust } from "./freshness";
import type { SourceGateInput, SourceGateResult, VerificationStatus } from "./types";

/**
 * Source Gate — provenance / auth / data class / consent admission control.
 * External producers require adapter provenance; internal require authentication.
 * Participant-reported stays participant-reported; model cannot masquerade as system.
 */
export function evaluateSourceGate(input: SourceGateInput): SourceGateResult {
  if (!input.tenantId) {
    return { allowed: false, error: "tenantId required", effectiveVerification: "unknown" };
  }

  if (input.producer === "authenticated_internal" && !input.authenticated) {
    return {
      allowed: false,
      error: "authenticated_internal producer requires authenticated=true",
      effectiveVerification: "unknown",
    };
  }

  if (input.producer === "external_adapter" && !input.adapterProvenance) {
    return {
      allowed: false,
      error: "external_adapter requires adapterProvenance",
      effectiveVerification: "unknown",
    };
  }

  if (input.producer === "participant" && input.sourceType !== "participant_declared") {
    return {
      allowed: false,
      error: "participant producer must use participant_declared source trust",
      effectiveVerification: "unknown",
    };
  }

  if (
    input.producer === "model_assist" &&
    input.sourceType !== "model_inference"
  ) {
    return {
      allowed: false,
      error: "model_assist producer must use model_inference source trust",
      effectiveVerification: "unknown",
    };
  }

  if (
    input.sourceType === "model_inference" &&
    input.producer !== "model_assist" &&
    input.producer !== "system_derived"
  ) {
    return {
      allowed: false,
      error: "model_inference source trust requires model_assist or system_derived producer",
      effectiveVerification: "inference_only",
    };
  }

  if (
    (input.sourceType === "verified_system_record" ||
      input.sourceType === "authenticated_provider_record") &&
    input.producer === "model_assist"
  ) {
    return {
      allowed: false,
      error: "model_assist cannot produce verified system/provider records",
      effectiveVerification: "inference_only",
    };
  }

  if (input.dataClasses.includes("credentials_secrets")) {
    return {
      allowed: false,
      error: "credentials_secrets may not enter Context Fabric",
      effectiveVerification: "unknown",
    };
  }

  if (
    (input.dataClasses.includes("health_sensitive") ||
      input.dataClasses.includes("safeguarding")) &&
    input.consentScopes.length === 0
  ) {
    return {
      allowed: false,
      error: "health_sensitive/safeguarding context requires consentScopes",
      effectiveVerification: "unknown",
    };
  }

  const effectiveVerification: VerificationStatus = verificationForSourceTrust(
    input.sourceType,
  );

  return { allowed: true, error: null, effectiveVerification };
}
