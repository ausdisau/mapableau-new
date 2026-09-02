import type { EligibilityResult, EvidenceItem, OptionCandidate, OptionsDomain } from "./types";

export function evaluateEvidenceEligibility(candidates: OptionCandidate[], domain: OptionsDomain): EligibilityResult[] {
  return candidates.map((c) => evaluateOne(c, domain));
}

function evaluateOne(candidate: OptionCandidate, domain: OptionsDomain): EligibilityResult {
  const evidenceGaps: string[] = [];
  const conflictingEvidence: string[] = [];
  const notes: string[] = [];
  if (candidate.evidence.length === 0) evidenceGaps.push("No evidence items attached to this candidate.");
  for (const item of candidate.evidence) classifyEvidence(item, evidenceGaps, conflictingEvidence);
  if (candidate.verificationState === "unverified") evidenceGaps.push("Provider/worker verification is unverified.");
  if (candidate.verificationState === "failed") conflictingEvidence.push("Verification previously failed.");
  if (domain === "care") notes.push("Candidate ≠ assignment. Credential presence does not prove competence.");
  if (domain === "transport") {
    notes.push("Candidate ≠ confirmation. Verified accessibility is required where necessary.");
    if (candidate.vehicleSuitability && !candidate.vehicleSuitability.verified) evidenceGaps.push("Vehicle suitability is not verified.");
  }
  if (domain === "jobs") {
    notes.push("Disclosure is participant-controlled. No automatic disability/health sharing with employers.");
    if (candidate.disclosureRequired) notes.push("This role may request disclosure — you decide whether and what to share.");
  }
  if (domain === "access") {
    notes.push("Absence of a recorded barrier does not mean a place is accessible.");
    if (candidate.accessProfile?.barrierAbsenceOnly) evidenceGaps.push("Access claim rests on absence-of-barrier only — not positive accessibility evidence.");
    if (!candidate.accessProfile?.source) evidenceGaps.push("Access evidence source is unknown.");
  }
  return { candidateId: candidate.id, eligible: true, evidenceGaps, conflictingEvidence, notes };
}

function classifyEvidence(item: EvidenceItem, gaps: string[], conflicts: string[]): void {
  switch (item.state) {
    case "missing": gaps.push(`Missing evidence: ${item.label}`); break;
    case "unverified":
    case "self_reported": gaps.push(`Unverified / self-reported: ${item.label}`); break;
    case "stale": gaps.push(`Stale evidence: ${item.label}${item.freshnessLabel ? ` (${item.freshnessLabel})` : ""}`); break;
    case "conflicting": conflicts.push(`Conflicting evidence: ${item.label}${item.notes ? ` — ${item.notes}` : ""}`); break;
    case "community_reported":
    case "verified": break;
    default: { const _exhaustive: never = item.state; void _exhaustive; gaps.push(`Unknown evidence state for ${item.label}`); }
  }
}

export function findEligibility(results: EligibilityResult[], candidateId: string) {
  return results.find((r) => r.candidateId === candidateId);
}
