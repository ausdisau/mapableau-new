import { isOptionsModelExplanationEnabled } from "@/lib/config/options-engine";
import type { DimensionScores, EligibilityResult, OptionCandidate, OptionExplanation, OptionsDomain } from "./types";

const DOMAIN_NEXT_STEP: Record<OptionsDomain, string> = {
  care: "If you choose this option, MapAble can prepare a support request for your review. No worker is assigned automatically.",
  transport: "If you choose this option, MapAble can prepare a transport request draft. Nothing is booked or confirmed until you approve.",
  jobs: "If you choose this option, MapAble can prepare next steps you control. Disability/health details are not shared with employers unless you consent.",
  access: "If you choose this option, review the access evidence and decide what to do next. Absence of barriers is not proof of accessibility.",
};

export function explainOption(input: {
  candidate: OptionCandidate; domain: OptionsDomain; dimensionScores: DimensionScores;
  eligibility?: EligibilityResult; requestModelExplanation?: boolean;
}): OptionExplanation {
  const { candidate, domain, dimensionScores, eligibility } = input;
  const whyItMatches = buildWhyMatches(candidate, dimensionScores);
  const evidence = candidate.evidence.map((e) => ({
    label: e.label, state: e.state,
    detail: [e.source, e.freshnessLabel, e.notes].filter(Boolean).join(" · ") || undefined,
  }));
  const unknowns: string[] = [...(eligibility?.evidenceGaps ?? [])];
  if (candidate.distanceKm == null) unknowns.push("Distance is unknown.");
  if (candidate.knownCostAud == null) unknowns.push("Cost is unknown.");
  if (candidate.availabilityWindows.length === 0) unknowns.push("Availability windows are unknown.");
  const imperfectFits: string[] = [...(eligibility?.conflictingEvidence ?? [])];
  if (dimensionScores.access_fit < 0.7) imperfectFits.push("Access fit is partial based on available evidence.");
  if (dimensionScores.continuity < 0.5) imperfectFits.push("Continuity signal is limited or unverified.");
  if (domain === "access" && candidate.accessProfile?.barrierAbsenceOnly) {
    imperfectFits.push("Access claim is based on absence of recorded barriers — not positive accessibility evidence.");
  }
  if (domain === "care") imperfectFits.push("Credential on file is not proof of competence for your specific supports.");
  const costIfKnown = candidate.knownCostAud != null
    ? `About $${candidate.knownCostAud.toFixed(2)} AUD (known estimate — confirm before proceeding).` : null;
  let modelCommentary: string | null = null;
  if (input.requestModelExplanation && isOptionsModelExplanationEnabled()) {
    modelCommentary = "Optional model commentary is enabled but this run uses deterministic explanation only — scores are unchanged.";
  }
  return {
    whyItMatches, evidence, unknowns, imperfectFits, costIfKnown,
    whoProvides: candidate.providerLabel, verificationState: candidate.verificationState,
    whatHappensNext: DOMAIN_NEXT_STEP[domain], modelCommentary,
  };
}

function buildWhyMatches(candidate: OptionCandidate, scores: DimensionScores): string[] {
  const reasons: string[] = [];
  const ranked = (Object.entries(scores) as Array<[keyof DimensionScores, number]>).sort((a, b) => b[1] - a[1]);
  for (const [dim, value] of ranked.slice(0, 4)) {
    if (value < 0.45) continue;
    switch (dim) {
      case "access_fit": reasons.push(`Access fit ${(value * 100).toFixed(0)}% from declared features and evidence.`); break;
      case "time_fit": reasons.push(`Time-window fit ${(value * 100).toFixed(0)}%.`); break;
      case "availability": reasons.push(`Availability signals present (${candidate.availabilityWindows.length || "limited"} window(s)).`); break;
      case "participant_preference": reasons.push(`Aligns with your stated preferences (${(value * 100).toFixed(0)}%).`); break;
      case "distance": reasons.push(candidate.distanceKm != null ? `Distance about ${candidate.distanceKm} km.` : "Distance not used as a decisive factor (unknown)."); break;
      case "continuity": reasons.push(`Continuity / familiarity signal ${(value * 100).toFixed(0)}%.`); break;
      case "known_cost": reasons.push(candidate.knownCostAud != null ? `Known cost estimate $${candidate.knownCostAud.toFixed(2)} AUD.` : "Cost unknown — not invented."); break;
      case "evidence_quality": reasons.push(`Evidence quality ${(value * 100).toFixed(0)}% (${candidate.evidence.length} item(s)).`); break;
      default: { const _exhaustive: never = dim; void _exhaustive; break; }
    }
  }
  if (reasons.length === 0) reasons.push("Passed hard constraints; ranked using transparent dimensions you can adjust.");
  return reasons;
}
