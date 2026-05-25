import { graphRepository } from "@/lib/mapable-graphs/repository";

export async function recordServiceOutcome(
  participantId: string,
  outcomeType: string,
  label: string,
  data: Record<string, unknown> = {}
) {
  const outcome = await graphRepository.createNode({
    graphType: "outcome",
    nodeType: "Outcome",
    participantId,
    label,
    status: "recorded",
    data: { outcomeType, ...data, notUsedForAutoReduction: true },
  });
  await graphRepository.recordGraphEvent({
    graphType: "outcome",
    participantId,
    eventType: "outcome.recorded",
    relatedNodeId: outcome.id,
    payload: { outcomeType },
  });
  return outcome;
}

export async function recordGoalProgress(
  participantId: string,
  goalNodeId: string,
  progressLabel: string,
  data?: Record<string, unknown>
) {
  const outcome = await recordServiceOutcome(
    participantId,
    "goal_progress",
    progressLabel,
    data
  );
  await linkOutcomeToGoal(participantId, outcome.id, goalNodeId);
  return outcome;
}

export async function recordParticipantFeedback(
  participantId: string,
  message: string,
  outcomeNodeId?: string
) {
  const feedback = await graphRepository.createNode({
    graphType: "outcome",
    nodeType: "Feedback",
    participantId,
    label: "Participant feedback",
    data: { message, source: "participant" },
  });
  if (outcomeNodeId) {
    await linkOutcomeToBooking(participantId, outcomeNodeId, feedback.id);
  }
  return feedback;
}

export async function linkOutcomeToGoal(
  participantId: string,
  outcomeId: string,
  goalNodeId: string
) {
  return graphRepository.createEdge({
    graphType: "outcome",
    edgeType: "SUPPORTS_GOAL",
    fromNodeId: outcomeId,
    toNodeId: goalNodeId,
    participantId,
  });
}

export async function linkOutcomeToBooking(
  participantId: string,
  outcomeId: string,
  bookingOrFeedbackId: string
) {
  return graphRepository.createEdge({
    graphType: "outcome",
    edgeType: "RESULTED_IN",
    fromNodeId: bookingOrFeedbackId,
    toNodeId: outcomeId,
    participantId,
  });
}

export async function generateOutcomeSummary(participantId: string) {
  const graph = await graphRepository.getGraphForParticipant(
    "outcome",
    participantId
  );
  const recent = graph.nodes.filter((n) => n.nodeType === "Outcome").slice(0, 10);
  const worked = recent.filter((o) =>
    ["arrived_on_time", "support_completed", "participant_satisfaction"].includes(
      String(o.data.outcomeType)
    )
  );
  const needsChange = recent.filter((o) =>
    ["transport_late", "complaint_lodged", "no_show"].includes(
      String(o.data.outcomeType)
    )
  );
  return {
    recentOutcomes: recent,
    whatWorked: worked.map((o) => o.label),
    whatNeedsChanging: needsChange.map((o) => o.label),
    disclaimer:
      "Outcomes inform future suggestions only. Support is never automatically reduced.",
  };
}
