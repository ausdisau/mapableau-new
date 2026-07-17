export type CredentialCheck = {
  name: string;
  passed: boolean;
  detail?: string;
};

export function evaluateCredentialChecks(
  checks: readonly CredentialCheck[]
): { ok: boolean; failed: string[] } {
  if (checks.length === 0) {
    return { ok: false, failed: ["CREDENTIAL_CHECKS_EMPTY_DENY"] };
  }
  const failed = checks.filter((c) => !c.passed).map((c) => c.name);
  return { ok: failed.length === 0, failed };
}
