export interface LicenceDecision {
  allowed: boolean;
  reason: string;
}

export function evaluateDataLicence(
  licence: string,
  use: "routing" | "open_data" | "internal",
): LicenceDecision {
  const normalized = licence.toLowerCase();
  if (normalized.includes("no derivatives") && use === "open_data")
    return { allowed: false, reason: "no_derivatives" };
  if (normalized.includes("internal only") && use !== "internal")
    return { allowed: false, reason: "internal_only" };
  return { allowed: true, reason: "licence_allows_use" };
}
