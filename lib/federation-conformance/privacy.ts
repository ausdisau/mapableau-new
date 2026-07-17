export interface PrivacyFinding {
  ok: boolean;
  code: string;
  message: string;
}

/**
 * Checklist-style privacy conformance. Runs deterministically against the
 * running environment so operators cannot ship a build that silently
 * disables the guardrails.
 */
export function checkPrivacyEnvironment(env: NodeJS.ProcessEnv): PrivacyFinding[] {
  const findings: PrivacyFinding[] = [];
  if (env.FEDERATION_ALLOW_RAW_USER_IDS === "true") {
    findings.push({
      ok: false,
      code: "privacy.raw_user_ids_allowed",
      message:
        "FEDERATION_ALLOW_RAW_USER_IDS must be unset or false — pairwise subject IDs are mandatory",
    });
  }
  if (
    env.FEDERATION_FHIR_OUTBOUND_ENABLED === "true" &&
    !env.FEDERATION_FHIR_OUTBOUND_RUNBOOK_REF
  ) {
    findings.push({
      ok: false,
      code: "privacy.fhir_runbook_missing",
      message:
        "FEDERATION_FHIR_OUTBOUND_RUNBOOK_REF must be set when FHIR outbound is enabled",
    });
  }
  if (env.FEDERATION_ALLOW_AUTO_ISSUE === "true") {
    findings.push({
      ok: false,
      code: "privacy.auto_issue_allowed",
      message:
        "FEDERATION_ALLOW_AUTO_ISSUE must be unset — credentials require explicit participant offer acceptance",
    });
  }
  if (findings.length === 0) {
    findings.push({
      ok: true,
      code: "privacy.ok",
      message: "privacy env guards intact",
    });
  }
  return findings;
}
