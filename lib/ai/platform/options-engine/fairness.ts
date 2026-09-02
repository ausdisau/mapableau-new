import type { HardConstraint, OptionCandidate, ProhibitedHeuristic, RankingPriorities } from "./types";
import { PROHIBITED_HEURISTICS } from "./types";

export type FairnessCheckResult = { passed: boolean; blockedHeuristics: ProhibitedHeuristic[]; notes: string[] };

export function assertFairRanking(input: {
  priorities: RankingPriorities; requirements: HardConstraint[]; candidates: OptionCandidate[]; attemptedHeuristics?: string[];
}): FairnessCheckResult {
  const blocked: ProhibitedHeuristic[] = [];
  const notes: string[] = [];
  for (const h of input.attemptedHeuristics ?? []) {
    if ((PROHIBITED_HEURISTICS as readonly string[]).includes(h)) blocked.push(h as ProhibitedHeuristic);
  }
  for (const req of input.requirements) {
    if (/diagnos|icd-?10|dsm-?5|medical.?condition/i.test(req.label + req.value)) {
      blocked.push("infer_compatibility_from_diagnosis");
      notes.push(`Requirement "${req.label}" looks diagnosis-shaped — ignored for ranking.`);
    }
  }
  const complexAccessCount = input.requirements.filter((r) => r.kind === "required_accessibility_feature" && r.required).length;
  if (complexAccessCount >= 2) notes.push("Multiple accessibility requirements present — Options Engine does not apply a complexity penalty.");
  for (const c of input.candidates) {
    const meta = c.metadata ?? {};
    if (typeof meta.profitMargin === "number" || typeof meta.easeScore === "number" || typeof meta.desirabilityScore === "number") {
      notes.push(`Candidate ${c.id} carried profitability/ease metadata — ignored for ranking.`);
    }
    if (typeof meta.diagnosisCompatibility === "number") {
      blocked.push("infer_compatibility_from_diagnosis");
      notes.push(`Candidate ${c.id} carried diagnosis-compatibility metadata — blocked.`);
    }
  }
  const prioritySum = Object.values(input.priorities).reduce((a, b) => a + b, 0);
  if (prioritySum <= 0) notes.push("Priorities were empty — defaults applied.");
  return { passed: blocked.length === 0, blockedHeuristics: [...new Set(blocked)], notes };
}

export function sanitizeCandidatesForFairness(candidates: OptionCandidate[]): OptionCandidate[] {
  return candidates.map((c) => {
    if (!c.metadata) return c;
    const { profitMargin: _p, easeScore: _e, desirabilityScore: _d, diagnosisCompatibility: _dc, complexityPenalty: _cp, ...rest } = c.metadata as Record<string, unknown>;
    void _p; void _e; void _d; void _dc; void _cp;
    return { ...c, metadata: rest };
  });
}

export function isProhibitedHeuristic(value: string): value is ProhibitedHeuristic {
  return (PROHIBITED_HEURISTICS as readonly string[]).includes(value);
}
