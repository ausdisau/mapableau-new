import type { HardConstraint, OptionCandidate } from "../types";
export function careDomainNotes(): string[] {
  return ["Care options are candidates only — MapAble never auto-assigns a worker.","A listed credential shows qualification on file, not competence for your supports.","You choose; a coordinator or Action Kernel proposal may follow — never silent assignment."];
}
export function enrichCareCandidate(candidate: OptionCandidate): OptionCandidate {
  return { ...candidate, domain: "care", metadata: { ...(candidate.metadata ?? {}), domainBoundary: "care_candidate_not_assignment" } };
}
export function careDefaultRequirements(extras: HardConstraint[] = []): HardConstraint[] { return [...extras]; }
export function toCareOptionCandidate(input: {
  id: string; tenantId: string; displayName: string; organisationName: string; credentials?: string[]; features?: string[];
  serviceAreas?: string[]; availabilityWindows?: string[]; verificationState?: OptionCandidate["verificationState"];
  distanceKm?: number | null; continuityScore?: number | null; knownCostAud?: number | null;
}): OptionCandidate {
  return enrichCareCandidate({
    id: input.id, domain: "care", tenantId: input.tenantId, displayName: input.displayName, providerLabel: input.organisationName,
    features: input.features ?? [], credentials: input.credentials ?? [], serviceAreas: input.serviceAreas ?? [],
    availabilityWindows: input.availabilityWindows ?? [], exclusions: [],
    evidence: [{ id: `${input.id}-cred`, label: "Worker credential status", state: input.verificationState === "verified" ? "verified" : "unverified", source: "worker_profile" }],
    verificationState: input.verificationState ?? "unverified", distanceKm: input.distanceKm ?? null, knownCostAud: input.knownCostAud ?? null,
    continuityScore: input.continuityScore ?? null, preferenceTags: [],
  });
}
