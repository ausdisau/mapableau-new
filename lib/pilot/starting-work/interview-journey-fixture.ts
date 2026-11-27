/**
 * Serializable fixture for the MapAble One interview journey example.
 * In-memory demo only — no booking, payment, dispatch, or model calls.
 * Constrained by docs/governance/asi-disability-care-constraints.md.
 */

export const INTERVIEW_EXAMPLE_MESSAGE =
  "I need support before leaving for my interview.";

export const INTERVIEW_SUGGESTED_MEANING =
  "I need replacement care support before my interview pickup.";

export type JourneyEvidenceState =
  | "needs_review"
  | "unknown"
  | "venue_reported"
  | "on_hold";

export type InterviewEvidenceItem = {
  id: "before_leaving" | "pickup" | "interview_venue";
  title: string;
  statusLabel: string;
  state: JourneyEvidenceState;
  detail: string;
  uncertainty: string;
};

export type InterviewJourneyFixture = {
  scenarioLabel: "Example scenario";
  title: "Plan my interview journey";
  situationSummary: string;
  careReplacementStatus: "needs_review";
  transportStatus: "on_hold";
  interviewStatus: "scheduled";
  exampleMessage: typeof INTERVIEW_EXAMPLE_MESSAGE;
  suggestedMeaning: typeof INTERVIEW_SUGGESTED_MEANING;
  evidence: InterviewEvidenceItem[];
  coordinator: {
    recipientLabel: string;
    purpose: string;
    proposedFields: Array<{ id: string; label: string; defaultChecked: false }>;
  };
  productionClaim: "none";
  bookingPaymentDispatch: false;
};

export const interviewJourneyFixture: InterviewJourneyFixture = {
  scenarioLabel: "Example scenario",
  title: "Plan my interview journey",
  situationSummary:
    "Your support worker cancelled. Your ride is on hold.",
  careReplacementStatus: "needs_review",
  transportStatus: "on_hold",
  interviewStatus: "scheduled",
  exampleMessage: INTERVIEW_EXAMPLE_MESSAGE,
  suggestedMeaning: INTERVIEW_SUGGESTED_MEANING,
  evidence: [
    {
      id: "before_leaving",
      title: "Before leaving",
      statusLabel: "Care replacement needs review",
      state: "needs_review",
      detail:
        "Interview, care replacement and pickup stay separate pieces of the plan.",
      uncertainty:
        "Worker cancellation blocks care authorisation until a person reviews replacement options. Screening and communication capability remain evidence for authorised human review only.",
    },
    {
      id: "pickup",
      title: "Pickup",
      statusLabel: "Ramp availability unknown",
      state: "unknown",
      detail: "Linked transport request stays requested; the ride displays as on hold.",
      uncertainty:
        "Ramp fit is not confirmed from this example. Choosing a different pickup preference does not publish or dispatch a trip.",
    },
    {
      id: "interview_venue",
      title: "Interview venue",
      statusLabel: "Venue-reported step-free entrance",
      state: "venue_reported",
      detail: "Harbour Civic Centre — illustrative proposed route only.",
      uncertainty:
        "Step-free access is venue-reported, not independently verified in this demo.",
    },
  ],
  coordinator: {
    recipientLabel: "Alex (example coordinator)",
    purpose: "Ask for help recovering the interview support plan",
    proposedFields: [
      { id: "original_words", label: "Original example words", defaultChecked: false },
      { id: "added_message", label: "Added message", defaultChecked: false },
      { id: "pickup_preference", label: "Pickup preference", defaultChecked: false },
    ],
  },
  productionClaim: "none",
  bookingPaymentDispatch: false,
};

export type PickupPreference = "keep_on_hold" | "ask_different";

export type InterviewHandoffReceipt = {
  id: string;
  createdAt: string;
  recipientLabel: string;
  purpose: string;
  message: string;
  selectedFieldIds: string[];
};

export function buildInterviewHandoffReceipt(input: {
  confirmedMeaning: string | null;
  addedMessage: string;
  pickupPreference: PickupPreference;
  selectedFieldIds: string[];
}): InterviewHandoffReceipt {
  const selected = new Set(input.selectedFieldIds);
  const message =
    input.confirmedMeaning?.trim() ||
    "Please help me recover my interview support plan.";

  const selectedFieldIds = [...selected].filter((id) =>
    interviewJourneyFixture.coordinator.proposedFields.some((f) => f.id === id),
  );

  return {
    id: `interview_handoff_${Date.now()}`,
    createdAt: new Date().toISOString(),
    recipientLabel: interviewJourneyFixture.coordinator.recipientLabel,
    purpose: interviewJourneyFixture.coordinator.purpose,
    message,
    selectedFieldIds: selectedFieldIds.filter((id) => {
      if (id === "added_message" && !input.addedMessage.trim()) return false;
      if (id === "pickup_preference" && !input.pickupPreference) return false;
      return true;
    }),
  };
}
