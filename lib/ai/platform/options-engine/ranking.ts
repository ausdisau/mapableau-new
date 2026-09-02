import { DEFAULT_RANKING_PRIORITIES, RANKING_DIMENSIONS, type DimensionScores, type EligibilityResult, type HardConstraint, type OptionCandidate, type RankingDimension, type RankingPriorities } from "./types";

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function normalizeRankingPriorities(partial?: Partial<RankingPriorities>): RankingPriorities {
  const merged: RankingPriorities = { ...DEFAULT_RANKING_PRIORITIES, ...partial };
  let sum = 0;
  for (const dim of RANKING_DIMENSIONS) sum += merged[dim];
  if (sum <= 0) return { ...DEFAULT_RANKING_PRIORITIES };
  const out = { ...merged };
  for (const dim of RANKING_DIMENSIONS) out[dim] = merged[dim] / sum;
  return out;
}

function includesIgnoreCase(haystacks: string[], needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  return haystacks.some((h) => h.toLowerCase().includes(n));
}

function scoreAccessFit(candidate: OptionCandidate, requirements: HardConstraint[]): number {
  const accessReqs = requirements.filter((r) => r.kind === "required_accessibility_feature" || r.kind === "verified_vehicle_suitability");
  if (accessReqs.length === 0) return candidate.accessProfile?.barrierAbsenceOnly ? 0.35 : 0.5;
  const hits = accessReqs.filter((r) => includesIgnoreCase([
    ...candidate.features,
    ...(candidate.vehicleSuitability?.wheelchairAccessible ? ["wheelchair"] : []),
    ...(candidate.vehicleSuitability?.hoistAvailable ? ["hoist"] : []),
  ], r.value)).length;
  return clamp01(hits / accessReqs.length);
}

function scoreTimeFit(candidate: OptionCandidate, requirements: HardConstraint[]): number {
  const windows = requirements.filter((r) => r.kind === "availability_window");
  if (windows.length === 0) return 0.5;
  return clamp01(windows.filter((r) => includesIgnoreCase(candidate.availabilityWindows, r.value)).length / windows.length);
}

function scoreAvailability(candidate: OptionCandidate): number {
  if (candidate.availabilityWindows.length === 0) return 0.35;
  return clamp01(Math.min(1, 0.5 + candidate.availabilityWindows.length * 0.15));
}

function scorePreference(candidate: OptionCandidate, requirements: HardConstraint[]): number {
  const prefs = requirements.filter((r) => !r.required).map((r) => r.value);
  const tags = [...candidate.preferenceTags, ...candidate.features];
  if (prefs.length === 0) return tags.length > 0 ? 0.55 : 0.5;
  return clamp01(prefs.filter((p) => includesIgnoreCase(tags, p)).length / prefs.length);
}

function scoreDistance(candidate: OptionCandidate): number {
  if (candidate.distanceKm == null) return 0.4;
  if (candidate.distanceKm <= 5) return 1;
  if (candidate.distanceKm <= 15) return 0.8;
  if (candidate.distanceKm <= 30) return 0.6;
  if (candidate.distanceKm <= 60) return 0.4;
  return 0.2;
}

function scoreContinuity(candidate: OptionCandidate): number {
  if (candidate.continuityScore != null) return clamp01(candidate.continuityScore);
  switch (candidate.verificationState) {
    case "verified": return 0.85;
    case "pending": return 0.5;
    case "unverified": return 0.35;
    case "failed": return 0.1;
    case "not_applicable": return 0.5;
    default: { const _exhaustive: never = candidate.verificationState; void _exhaustive; return 0.4; }
  }
}

function scoreKnownCost(candidate: OptionCandidate): number {
  if (candidate.knownCostAud == null) return 0.5;
  if (candidate.knownCostAud <= 50) return 0.9;
  if (candidate.knownCostAud <= 120) return 0.7;
  if (candidate.knownCostAud <= 250) return 0.5;
  return 0.35;
}

function scoreEvidenceQuality(candidate: OptionCandidate, eligibility?: EligibilityResult): number {
  if (eligibility && eligibility.conflictingEvidence.length > 0) return 0.15;
  if (eligibility && eligibility.evidenceGaps.length > 2) return 0.35;
  if (candidate.evidence.length === 0) return 0.25;
  const verified = candidate.evidence.filter((e) => e.state === "verified").length;
  const conflicting = candidate.evidence.filter((e) => e.state === "conflicting").length;
  if (conflicting > 0) return 0.2;
  return clamp01(0.3 + (verified / candidate.evidence.length) * 0.7);
}

export function scoreDimensions(candidate: OptionCandidate, requirements: HardConstraint[], eligibility?: EligibilityResult): DimensionScores {
  return {
    access_fit: scoreAccessFit(candidate, requirements),
    time_fit: scoreTimeFit(candidate, requirements),
    availability: scoreAvailability(candidate),
    participant_preference: scorePreference(candidate, requirements),
    distance: scoreDistance(candidate),
    continuity: scoreContinuity(candidate),
    known_cost: scoreKnownCost(candidate),
    evidence_quality: scoreEvidenceQuality(candidate, eligibility),
  };
}

export function weightedScore(dimensions: DimensionScores, priorities: RankingPriorities): number {
  let total = 0;
  for (const dim of RANKING_DIMENSIONS) total += dimensions[dim] * priorities[dim];
  return clamp01(total);
}

export function rankCandidates(input: {
  candidates: OptionCandidate[]; requirements: HardConstraint[]; priorities: RankingPriorities; eligibility: EligibilityResult[];
}): Array<{ candidate: OptionCandidate; score: number; dimensionScores: DimensionScores }> {
  const byId = new Map(input.eligibility.map((e) => [e.candidateId, e]));
  const scored = input.candidates.map((candidate) => {
    const dimensionScores = scoreDimensions(candidate, input.requirements, byId.get(candidate.id));
    return { candidate, score: weightedScore(dimensionScores, input.priorities), dimensionScores };
  });
  scored.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.candidate.displayName.localeCompare(b.candidate.displayName)));
  return scored;
}

export function describePriorities(priorities: RankingPriorities): string[] {
  return (Object.entries(priorities) as Array<[RankingDimension, number]>)
    .sort((a, b) => b[1] - a[1])
    .map(([dim, weight]) => `${dim.replace(/_/g, " ")}: ${(weight * 100).toFixed(0)}%`);
}
