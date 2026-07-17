export type PilotConfigSnapshot = {
  supportItemAllowlist: string[];
  fundingRouteAllowlist: string[];
  integrationProfileIds: string[];
  maxTransactionCents: number;
  maxTotalExposureCents: number;
  limitedLiveEnabled: boolean;
};

export function detectConfigurationDrift(
  expected: PilotConfigSnapshot,
  actual: PilotConfigSnapshot
): string[] {
  const drifts: string[] = [];
  const keys: (keyof PilotConfigSnapshot)[] = [
    "maxTransactionCents",
    "maxTotalExposureCents",
    "limitedLiveEnabled",
  ];
  for (const key of keys) {
    if (expected[key] !== actual[key]) drifts.push(String(key));
  }
  if (
    JSON.stringify([...expected.supportItemAllowlist].sort()) !==
    JSON.stringify([...actual.supportItemAllowlist].sort())
  ) {
    drifts.push("supportItemAllowlist");
  }
  if (
    JSON.stringify([...expected.fundingRouteAllowlist].sort()) !==
    JSON.stringify([...actual.fundingRouteAllowlist].sort())
  ) {
    drifts.push("fundingRouteAllowlist");
  }
  if (
    JSON.stringify([...expected.integrationProfileIds].sort()) !==
    JSON.stringify([...actual.integrationProfileIds].sort())
  ) {
    drifts.push("integrationProfileIds");
  }
  return drifts;
}
