import type { MapAbleModule } from "@/intelligence/types";
import type { MapAbleHumanReviewItem } from "@/lib/ai/platform/agents/types";

const SAFEGUARDING_CUES = [
  "safeguarding",
  "abuse",
  "neglect",
  "allegation",
  "restrictive practice",
  "mandatory report",
  "mandatory reporting",
  "child protection",
  "elder abuse",
  "sexual assault",
  "family violence",
  "domestic violence",
] as const;

export type SafeguardingGateInput = {
  objective: string;
  domains?: MapAbleModule[];
  evidenceRefs?: string[];
  traceId?: string;
};

export type SafeguardingGateResult =
  | {
      halted: false;
      matched: false;
    }
  | {
      halted: true;
      matched: true;
      humanReviewItem: MapAbleHumanReviewItem;
      continuationMessage: string;
      /** Explicitly false — AI must never decide these. */
      aiMayDecideReportability: false;
      aiMaySubstantiateAllegation: false;
      aiMayAuthoriseRestrictivePractice: false;
      aiMayCloseIncidentOrComplaint: false;
    };

function detectSafeguardingCue(objective: string): string | null {
  const lower = objective.toLowerCase();
  for (const cue of SAFEGUARDING_CUES) {
    if (lower.includes(cue)) return cue;
  }
  return null;
}

/**
 * Cross-cutting human escalation gate — not an operational agent.
 *
 * May: detect safeguarded workflow, halt AI execution, create human-review item,
 * preserve evidence, tell the user how the workflow continues.
 *
 * Must not: determine whether abuse occurred, substantiate/dismiss allegations,
 * decide incident reportability, authorise restrictive practices, or close
 * incidents/complaints.
 */
export function evaluateSafeguardingGate(
  input: SafeguardingGateInput
): SafeguardingGateResult {
  const cue = detectSafeguardingCue(input.objective);
  if (!cue) {
    return { halted: false, matched: false };
  }

  const evidenceRefs = input.evidenceRefs ?? [];
  const continuationMessage =
    "This request needs an authorised human safeguarding review. " +
    "MapAble AI has stopped automated processing. Your supplied information is preserved. " +
    "A human reviewer will continue the workflow; AI will not decide reportability, " +
    "substantiate or dismiss allegations, or close the matter.";

  const humanReviewItem: MapAbleHumanReviewItem = {
    id: `safeguarding-review-${input.traceId ?? "pending"}`,
    category: "safeguarding",
    reason: `Safeguarding cue detected (${cue}); AI execution halted for human review.`,
    urgency: "urgent",
    evidenceRefs: [...evidenceRefs],
    continuationMessage,
    aiMayDecideReportability: false,
    aiMaySubstantiateAllegation: false,
  };

  return {
    halted: true,
    matched: true,
    humanReviewItem,
    continuationMessage,
    aiMayDecideReportability: false,
    aiMaySubstantiateAllegation: false,
    aiMayAuthoriseRestrictivePractice: false,
    aiMayCloseIncidentOrComplaint: false,
  };
}

/** Hard guarantee used by tests and callers. */
export function safeguardingGateMayDecideReportability(): false {
  return false;
}

export function safeguardingGateMaySubstantiateAllegation(): false {
  return false;
}
