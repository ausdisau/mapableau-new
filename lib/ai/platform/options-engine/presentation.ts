import type { OptionsSession, RankedOption } from "./types";
import { describePriorities } from "./ranking";

export type OptionsPresentation = {
  heading: string; summary: string; rankingLabels: string[]; limitations: string[];
  options: Array<{ optionId: string; title: string; provider: string; scorePercent: string; why: string[]; unknowns: string[]; imperfect: string[]; cost: string | null; verification: string; next: string; dimensionBreakdown: Array<{ label: string; percent: string }> }>;
  selectedOptionId: string | null; authorityNotice: string;
};

export function formatOptionsForParticipant(session: OptionsSession): OptionsPresentation {
  return {
    heading: `${session.domain.charAt(0).toUpperCase()}${session.domain.slice(1)} options`,
    summary: session.options.length === 0
      ? "No safe options passed your hard requirements. Try adjusting filters or ask for human help."
      : `${session.options.length} option(s) matched your hard requirements. Scores use transparent factors you can adjust — this is not an automatic assignment.`,
    rankingLabels: describePriorities(session.rankingPriorities),
    limitations: session.limitations,
    options: session.options.map(presentOption),
    selectedOptionId: session.selectedOptionId,
    authorityNotice: "MapAble generates options only. Choosing prepares a draft action for your approval — it does not assign workers, book transport, or share disability details with employers.",
  };
}

function presentOption(o: RankedOption) {
  return {
    optionId: o.optionId, title: o.displayName, provider: o.providerLabel, scorePercent: `${(o.score * 100).toFixed(0)}%`,
    why: o.explanation.whyItMatches, unknowns: o.explanation.unknowns, imperfect: o.explanation.imperfectFits,
    cost: o.explanation.costIfKnown, verification: o.explanation.verificationState, next: o.explanation.whatHappensNext,
    dimensionBreakdown: Object.entries(o.dimensionScores).map(([label, value]) => ({ label: label.replace(/_/g, " "), percent: `${(value * 100).toFixed(0)}%` })),
  };
}
