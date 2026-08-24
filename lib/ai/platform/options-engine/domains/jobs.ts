import type { HardConstraint, OptionCandidate } from "../types";
export function jobsDomainNotes(): string[] {
  return ["Jobs options never auto-disclose disability or health information to employers.","Functional requirement matching runs only when you authorise it.","You control disclosure — MapAble prepares next steps, not applications on your behalf without approval."];
}
export function enrichJobsCandidate(candidate: OptionCandidate): OptionCandidate {
  return { ...candidate, domain: "jobs", metadata: { ...(candidate.metadata ?? {}), domainBoundary: "jobs_disclosure_participant_controlled" } };
}
export function jobsDisclosureBoundaryConstraint(): HardConstraint {
  return { kind: "consent_disclosure_boundary", label: "No employer disability disclosure without consent", value: "disclosure", required: true };
}
export function toJobsOptionCandidate(input: {
  id: string; tenantId: string; displayName: string; employerLabel: string; requirements?: string[];
  serviceAreas?: string[]; disclosureRequired?: boolean; distanceKm?: number | null; knownCostAud?: number | null;
}): OptionCandidate {
  return enrichJobsCandidate({
    id: input.id, domain: "jobs", tenantId: input.tenantId, displayName: input.displayName, providerLabel: input.employerLabel,
    features: input.requirements ?? [], credentials: [], serviceAreas: input.serviceAreas ?? [], availabilityWindows: [], exclusions: [],
    evidence: [{ id: `${input.id}-job`, label: "Job posting requirements", state: "self_reported", source: "employer_posting" }],
    verificationState: "not_applicable", distanceKm: input.distanceKm ?? null, knownCostAud: input.knownCostAud ?? null,
    continuityScore: null, preferenceTags: input.requirements ?? [], disclosureRequired: input.disclosureRequired ?? false,
  });
}
export function scrubEmployerFacingPayload(payload: Record<string, unknown>, disclosureConsentGranted: boolean): Record<string, unknown> {
  if (disclosureConsentGranted) return { ...payload };
  const { disability: _d, health: _h, diagnosis: _diag, medical: _m, accessibilityProfile: _a, ...rest } = payload;
  void _d; void _h; void _diag; void _m; void _a;
  return { ...rest, disclosureStatus: "withheld_by_participant" };
}
