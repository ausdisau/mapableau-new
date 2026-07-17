export type ReleaseGate = {
  key: string;
  passed: boolean;
  detail: string;
};

export function evaluateReleaseGates(params: {
  typeCheckPassed: boolean;
  testsPassed: boolean;
  assuranceEvaluationEnabled: boolean;
  secretsInDiff: boolean;
}): ReleaseGate[] {
  return [
    {
      key: "type_check",
      passed: params.typeCheckPassed,
      detail: params.typeCheckPassed ? "Type-check passed" : "Type-check failed",
    },
    {
      key: "tests",
      passed: params.testsPassed,
      detail: params.testsPassed ? "Required tests passed" : "Required tests failed",
    },
    {
      key: "assurance_eval_flag",
      passed: params.assuranceEvaluationEnabled,
      detail: "ASSURANCE_EVALUATION_ENABLED must be on for release readiness reports",
    },
    {
      key: "no_secrets_in_diff",
      passed: !params.secretsInDiff,
      detail: params.secretsInDiff ? "Secrets detected in diff" : "No secrets flagged",
    },
  ];
}

export function allReleaseGatesPassed(gates: ReleaseGate[]): boolean {
  return gates.every((g) => g.passed);
}
