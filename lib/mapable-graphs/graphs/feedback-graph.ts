import { graphRepository } from "@/lib/mapable-graphs/repository";

export async function recordParticipantConfirmation(
  participantId: string,
  targetNodeId: string,
  actorId?: string
) {
  return recordFeedbackEntry(
    participantId,
    "confirmation",
    "Participant confirmed",
    { targetNodeId, rlhfEligible: false },
    actorId
  );
}

export async function recordParticipantEdit(
  participantId: string,
  targetNodeId: string,
  changes: Record<string, unknown>,
  actorId?: string
) {
  return recordFeedbackEntry(
    participantId,
    "edit",
    "Participant edit",
    { targetNodeId, changes, rlhfEligible: true, modelTrainingDefault: false },
    actorId
  );
}

export async function recordParticipantRejection(
  participantId: string,
  targetNodeId: string,
  reason?: string,
  actorId?: string
) {
  return recordFeedbackEntry(
    participantId,
    "rejection",
    "Participant rejection",
    { targetNodeId, reason, rlhfEligible: true },
    actorId
  );
}

export async function recordHumanOverride(
  participantId: string,
  message: string,
  actorId?: string
) {
  return recordFeedbackEntry(
    participantId,
    "override",
    "Human override",
    { message },
    actorId
  );
}

export async function recordComplaint(
  participantId: string,
  message: string,
  actorId?: string
) {
  const complaint = await graphRepository.createNode({
    graphType: "feedback",
    nodeType: "Complaint",
    participantId,
    label: "Complaint",
    status: "open",
    data: { message, sensitive: true, modelTrainingDefault: false },
    createdBy: actorId,
  });
  await recordLearningSignal(participantId, "complaint", complaint.id);
  return complaint;
}

async function recordFeedbackEntry(
  participantId: string,
  feedbackType: string,
  label: string,
  data: Record<string, unknown>,
  actorId?: string
) {
  const feedback = await graphRepository.createNode({
    graphType: "feedback",
    nodeType: "Feedback",
    participantId,
    label,
    status: "recorded",
    data: { feedbackType, ...data, modelTrainingDefault: false },
    createdBy: actorId,
  });
  await graphRepository.recordGraphEvent({
    graphType: "feedback",
    participantId,
    eventType: `feedback.${feedbackType}`,
    relatedNodeId: feedback.id,
    actorId,
    actorType: actorId ? "participant" : "system",
  });
  return feedback;
}

export async function recordLearningSignal(
  participantId: string,
  signalType: string,
  relatedNodeId?: string
) {
  const signal = await graphRepository.createNode({
    graphType: "feedback",
    nodeType: "LearningSignal",
    participantId,
    label: signalType,
    data: {
      signalType,
      forCPSimWeightTuning: true,
      forMDSimReliability: true,
      sendToModelTraining: false,
    },
  });
  if (relatedNodeId) {
    await linkFeedbackToRecommendation(participantId, signal.id, relatedNodeId);
  }
  return signal;
}

export async function linkFeedbackToRecommendation(
  participantId: string,
  feedbackId: string,
  recommendationOrTargetId: string
) {
  return graphRepository.createEdge({
    graphType: "feedback",
    edgeType: "UPDATED_AFTER_FEEDBACK",
    fromNodeId: feedbackId,
    toNodeId: recommendationOrTargetId,
    participantId,
  });
}

export async function linkFeedbackToOutcome(
  participantId: string,
  feedbackId: string,
  outcomeId: string
) {
  return graphRepository.createEdge({
    graphType: "feedback",
    edgeType: "RESULTED_IN",
    fromNodeId: feedbackId,
    toNodeId: outcomeId,
    participantId,
  });
}
