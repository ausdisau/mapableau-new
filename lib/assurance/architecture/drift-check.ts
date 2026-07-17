export type ArchitectureDriftFinding = {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
};

export function checkArchitectureDrift(params: {
  expectedAdapterModes: string[];
  actualAdapterModes: string[];
  directNdiaWithoutApproval: boolean;
}): ArchitectureDriftFinding[] {
  const findings: ArchitectureDriftFinding[] = [];

  for (const expected of params.expectedAdapterModes) {
    if (!params.actualAdapterModes.includes(expected)) {
      findings.push({
        code: "missing_adapter_mode",
        severity: "medium",
        message: `Expected adapter mode missing: ${expected}`,
      });
    }
  }

  if (params.directNdiaWithoutApproval) {
    findings.push({
      code: "ndia_direct_without_approval",
      severity: "high",
      message: "Direct NDIA adapter path present without external approval evidence.",
    });
  }

  return findings;
}
