import type { MatchCandidateScore } from "./matching-types";

export function explainMatch(candidate: MatchCandidateScore): string {
  if (!candidate.hardFilterPassed) {
    return candidate.reasons.map((r) => r.label).join(" ");
  }
  const top = candidate.reasons
    .slice(0, 3)
    .map((r) => r.label)
    .join(" ");
  return top || "Meets safety and availability requirements.";
}

export function formatMatchWarnings(warnings: string[]): string[] {
  return warnings.map((w) => `Note: ${w}`);
}
