import type { GaisEvidenceRef } from "@/lib/gais/contracts/evidence";

import type { GaisAccessConditionEvent, GaisAccessConditionType } from "./types";

function isCommunityReported(
  verificationState: string,
  evidence: GaisEvidenceRef[],
): boolean {
  if (verificationState === "community_reported") return true;
  return evidence.some((e) => e.sourceType === "COMMUNITY_REPORTED");
}

function isVerified(verificationState: string, evidence: GaisEvidenceRef[]): boolean {
  if (verificationState === "verified") return true;
  return evidence.some(
    (e) => e.sourceType === "VERIFIED" || e.sourceType === "AUTHORITATIVE_SOURCE",
  );
}

function statusUnknown(verificationState: string, evidence: GaisEvidenceRef[]): boolean {
  if (!verificationState || verificationState === "unknown") return true;
  if (!evidence.length) return true;
  return evidence.every((e) => e.sourceType === "UNKNOWN");
}

/**
 * Factual public labels for Access Conditions.
 * Never "Route unsafe" or universal accessibility verdicts.
 */
export function accessConditionDisplayLabel(params: {
  eventType: GaisAccessConditionType;
  verificationState: string;
  evidence: GaisEvidenceRef[];
}): string {
  if (statusUnknown(params.verificationState, params.evidence)) {
    return "Current status unknown";
  }

  const community = isCommunityReported(params.verificationState, params.evidence);
  const verified = isVerified(params.verificationState, params.evidence);

  switch (params.eventType) {
    case "OBSTRUCTION":
      return community
        ? "Community-reported temporary obstruction"
        : verified
          ? "Verified temporary obstruction reported"
          : "Temporary obstruction reported";
    case "LIFT_OUTAGE":
      return community ? "Community-reported lift outage" : "Lift outage reported";
    case "PATH_CLOSURE":
      return community
        ? "Community-reported path closure"
        : "Path closure reported";
    case "CONSTRUCTION":
      return community
        ? "Community-reported construction activity"
        : "Construction activity reported";
    case "SURFACE_ISSUE":
      return community
        ? "Community-reported surface issue"
        : "Surface issue reported";
    case "OTHER":
    default:
      return community
        ? "Community-reported access condition"
        : "Access condition reported";
  }
}

export function labelAccessConditionEvent(event: GaisAccessConditionEvent): string {
  return accessConditionDisplayLabel({
    eventType: event.eventType,
    verificationState: event.verificationState,
    evidence: event.evidence,
  });
}
