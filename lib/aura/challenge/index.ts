import type { AuraProofPlan } from "../schemas";

/**
 * Bounded adversarial self-challenge — advisory only.
 * Deterministic verifier remains authoritative.
 * Limited to one cycle (no open-ended recursion).
 */
export function challengePlan(plan: AuraProofPlan): {
  cycle: 1;
  questions: Array<{ question: string; advisoryAnswer: string }>;
  advisoryOnly: true;
} {
  const weakest = plan.evidence
    .slice()
    .sort((a, b) => a.confidence - b.confidence)[0];

  return {
    cycle: 1,
    advisoryOnly: true,
    questions: [
      {
        question: "What evidence would falsify this plan?",
        advisoryAnswer:
          weakest
            ? `Contradiction of ${weakest.evidenceId} or restoration status of blocked lifts/entrances.`
            : "Any new calibrated measurement that fails a required feature.",
      },
      {
        question: "Which required feature has the weakest evidence?",
        advisoryAnswer: weakest
          ? `${weakest.evidenceId} (confidence ${weakest.confidence})`
          : "No evidence attached.",
      },
      {
        question: "What happens when the preferred route fails?",
        advisoryAnswer:
          plan.rejectedAlternatives[0]
            ? `Fallback review needed; first rejected option was ${plan.rejectedAlternatives[0].label}.`
            : "Use standard non-AI journey planner and venue contact.",
      },
      {
        question: "Which assumptions remain?",
        advisoryAnswer: plan.assumptions.join(" ") || "None listed.",
      },
      {
        question: "Is there an option requiring less disclosure?",
        advisoryAnswer:
          "Yes — share only required functional fields; never diagnosis. Prefer standard Access map without venue request.",
      },
      {
        question: "Can this goal be completed using standard non-AI services?",
        advisoryAnswer:
          "Yes — /access, visit plans, verify-my-venue, and journey planner remain available.",
      },
      {
        question: "Does the plan accidentally weaken a participant requirement?",
        advisoryAnswer:
          plan.blockers.length > 0
            ? "Blockers remain listed; do not proceed as suitable without conditions."
            : "Required blockers empty; unknowns must stay unknown.",
      },
      {
        question: "Is human confirmation needed?",
        advisoryAnswer:
          plan.unknowns.length > 0
            ? "Yes — confirm unknowns (toilet ops, reception) before relying on them."
            : "Confirm route timing with the participant.",
      },
    ],
  };
}
