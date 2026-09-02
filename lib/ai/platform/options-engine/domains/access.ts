import type { OptionCandidate } from "../types";
export function accessDomainNotes(): string[] {
  return ["Access options require source, freshness, and verification context.","Absence of a recorded barrier does not mean a place is accessible.","Conflicting or stale access evidence is shown — never silently treated as clear."];
}
export function enrichAccessCandidate(candidate: OptionCandidate): OptionCandidate {
  return { ...candidate, domain: "access", metadata: { ...(candidate.metadata ?? {}), domainBoundary: "access_absence_not_accessible" } };
}
export function toAccessOptionCandidate(input: {
  id: string; tenantId: string; displayName: string; placeLabel: string; features?: string[];
  claimedAccessible: boolean; barrierAbsenceOnly: boolean; source?: string; freshnessLabel?: string;
  evidenceState?: OptionCandidate["evidence"][number]["state"]; distanceKm?: number | null;
}): OptionCandidate {
  return enrichAccessCandidate({
    id: input.id, domain: "access", tenantId: input.tenantId, displayName: input.displayName, providerLabel: input.placeLabel,
    features: input.features ?? [], credentials: [], serviceAreas: [], availabilityWindows: [], exclusions: [],
    evidence: [{ id: `${input.id}-access`, label: "Place accessibility evidence",
      state: input.evidenceState ?? (input.barrierAbsenceOnly ? "unverified" : "verified"),
      source: input.source, freshnessLabel: input.freshnessLabel,
      notes: input.barrierAbsenceOnly ? "Claim based on absence of recorded barriers only." : undefined }],
    verificationState: input.barrierAbsenceOnly ? "unverified" : "verified", distanceKm: input.distanceKm ?? null,
    knownCostAud: null, continuityScore: null, preferenceTags: [],
    accessProfile: { claimedAccessible: input.claimedAccessible, barrierAbsenceOnly: input.barrierAbsenceOnly, source: input.source, freshnessLabel: input.freshnessLabel },
  });
}
