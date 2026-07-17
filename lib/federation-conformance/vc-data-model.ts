import type { IssuedCredential } from "@prisma/client";

/**
 * Basic W3C VC Data Model shape check. Wave 9 emits documents shaped like a
 * VC but does not sign them cryptographically outside of simulator scope.
 */

export interface VcConformanceFinding {
  ok: boolean;
  code: string;
  message: string;
}

export function checkVcConformance(
  credential: IssuedCredential
): VcConformanceFinding[] {
  const findings: VcConformanceFinding[] = [];
  if (!credential.subjectId) {
    findings.push({
      ok: false,
      code: "vc.subject_missing",
      message: "credentialSubject.id must be present",
    });
  }
  if (
    !credential.credentialSubject ||
    typeof credential.credentialSubject !== "object"
  ) {
    findings.push({
      ok: false,
      code: "vc.subject_shape",
      message: "credentialSubject must be an object",
    });
  }
  if (credential.simulator === false && !credential.proofValue) {
    findings.push({
      ok: false,
      code: "vc.proof_missing_on_production",
      message: "non-simulator credentials must have a proofValue",
    });
  }
  if (findings.length === 0) {
    findings.push({
      ok: true,
      code: "vc.ok",
      message: "credential shape acceptable",
    });
  }
  return findings;
}
