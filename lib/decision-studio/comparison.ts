import type { DecisionComparison, DecisionOption } from "./types";

/**
 * Deterministic comparison from participant-selected criteria.
 * Does not rank by commercial interest or provider payment.
 */
export function buildDecisionComparison(input: {
  decisionCaseId: string;
  options: DecisionOption[];
  hardRequirements: string[];
  preferences: string[];
}): DecisionComparison {
  const commercial = input.options
    .filter((o) => o.commercialInterest)
    .map(
      (o) =>
        `${o.label}: commercial interest disclosed (${o.commercialInterest})`
    );

  const unknowns = [
    ...new Set(input.options.flatMap((o) => o.unknowns)),
  ];
  const conflicts = [
    ...new Set(input.options.flatMap((o) => o.conflicts)),
  ];

  const hardNotConfirmed = input.hardRequirements.filter((req) =>
    input.options.every(
      (o) =>
        !o.accessEffect?.toLowerCase().includes(req.toLowerCase()) &&
        !o.serviceEffect?.toLowerCase().includes(req.toLowerCase()) &&
        !o.communicationEffect?.toLowerCase().includes(req.toLowerCase())
    )
  );

  return {
    decisionCaseId: input.decisionCaseId,
    whatRemainsTheSame: [
      "Participant remains the decision-maker",
      "Hard requirements must still be met before execution",
      "No option is pre-selected",
    ],
    whatChanges: input.options.map(
      (o) => `${o.label}: ${o.serviceEffect ?? o.timingEffect ?? "see option"}`
    ),
    hardRequirementsPreserved: input.hardRequirements.filter(
      (r) => !hardNotConfirmed.includes(r)
    ),
    hardRequirementsNotConfirmed: hardNotConfirmed,
    preferencesPreserved: input.preferences,
    newUnknowns: unknowns,
    newRisks: [...conflicts, ...commercial],
    participantQuestions: [
      "Which option keeps my hard requirements?",
      "What is still unknown?",
      "Do I want a human to review this with me?",
    ],
    humanReviewRequired:
      hardNotConfirmed.length > 0 || conflicts.length > 0,
  };
}

/** Detect provider-paid ranking attempts — studio refuses to reorder. */
export function assertNoProviderPaidRanking(options: DecisionOption[]): void {
  const sortedByCommercial = [...options].sort((a, b) => {
    const aPaid = a.commercialInterest ? 1 : 0;
    const bPaid = b.commercialInterest ? 1 : 0;
    return bPaid - aPaid;
  });
  const sameOrder = options.every(
    (o, i) => o.id === sortedByCommercial[i]?.id
  );
  if (
    options.some((o) => o.commercialInterest) &&
    sameOrder &&
    options[0]?.commercialInterest
  ) {
    throw new Error(
      "Provider-paid ranking refused: commercial interest must not place an option first"
    );
  }
}

export function sortOptionsNeutrally(options: DecisionOption[]): DecisionOption[] {
  return [...options].sort((a, b) => a.sortIndex - b.sortIndex);
}
