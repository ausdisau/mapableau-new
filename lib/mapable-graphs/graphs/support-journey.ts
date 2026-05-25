import { classifySupportFromQuery } from "@/lib/mapable-graphs/llm-integration";
import { graphRepository } from "@/lib/mapable-graphs/repository";
import {
  addParticipantGoal,
  addFunctionalSignal,
} from "@/lib/mapable-graphs/graphs/participant-journey";
import type { SupportJourneyGraph } from "@/lib/mapable-graphs/types";

export async function createSupportJourney(
  participantId: string,
  createdBy?: string
): Promise<SupportJourneyGraph> {
  await graphRepository.recordGraphEvent({
    graphType: "support_journey",
    participantId,
    eventType: "support_journey.created",
    actorId: createdBy,
    actorType: createdBy ? "user" : "system",
  });
  return graphRepository.getGraphForParticipant(
    "support_journey",
    participantId
  ) as Promise<SupportJourneyGraph>;
}

export async function inferSupportNeedFromLLM(
  participantId: string,
  query: string,
  actorId?: string
) {
  const classification = classifySupportFromQuery(query);
  await createSupportJourney(participantId, actorId);

  for (const goal of classification.goals) {
    await addParticipantGoal(participantId, goal.label, goal.key, actorId);
  }

  for (const signal of classification.sensorySignals ?? []) {
    await addFunctionalSignal(
      participantId,
      signal.replace(/_/g, " "),
      { source: "participant_narrative", nonDiagnostic: true },
      actorId
    );
  }

  const needs = [];
  for (const need of classification.supportNeeds) {
    const node = await graphRepository.createNode({
      graphType: "support_journey",
      nodeType: "SupportNeed",
      participantId,
      label: need.label,
      status: "draft",
      entityId: need.key,
      data: {
        key: need.key,
        inferredFromQuery: true,
        requiresConfirmation: true,
      },
      createdBy: actorId,
    });
    needs.push(node);
  }

  await graphRepository.recordGraphEvent({
    graphType: "support_journey",
    participantId,
    eventType: "support_needs.inferred",
    actorId,
    actorType: "system",
    payload: { classification, nonDiagnostic: true },
  });

  return { classification, supportNeeds: needs };
}

export async function confirmSupportNeedGraph(
  participantId: string,
  nodeId: string,
  actorId?: string
) {
  const node = await graphRepository.updateNode(nodeId, {
    status: "participant_confirmed",
  });
  await graphRepository.recordGraphEvent({
    graphType: "support_journey",
    participantId,
    eventType: "support_need.confirmed",
    relatedNodeId: nodeId,
    actorId,
    actorType: "participant",
  });
  return node;
}

export async function rejectSupportNeedGraph(
  participantId: string,
  nodeId: string,
  reason?: string,
  actorId?: string
) {
  const node = await graphRepository.updateNode(nodeId, {
    status: "participant_rejected",
    data: { rejectionReason: reason },
  });
  await graphRepository.recordGraphEvent({
    graphType: "support_journey",
    participantId,
    eventType: "support_need.rejected",
    relatedNodeId: nodeId,
    actorId,
    actorType: "participant",
    payload: { reason },
  });
  return node;
}

export async function generateRecommendation(
  participantId: string,
  supportNeedId: string,
  label: string,
  explanation: string,
  createdBy?: string
) {
  const rec = await graphRepository.createNode({
    graphType: "support_journey",
    nodeType: "Recommendation",
    participantId,
    label,
    status: "draft",
    data: { explanation, requiresConfirmation: true },
    createdBy,
  });
  await graphRepository.createEdge({
    graphType: "support_journey",
    edgeType: "RECOMMENDED_BECAUSE_OF",
    fromNodeId: rec.id,
    toNodeId: supportNeedId,
    participantId,
    createdBy,
  });
  return rec;
}

export function explainRecommendation(rec: {
  label: string;
  data: Record<string, unknown>;
}): string {
  const explanation = rec.data.explanation;
  if (typeof explanation === "string") return explanation;
  return `This suggestion (${rec.label}) is a draft based on your goals and needs. You can change or reject it before any booking.`;
}

export async function createServicePlan(
  participantId: string,
  title: string,
  recommendationIds: string[],
  createdBy?: string
) {
  const plan = await graphRepository.createNode({
    graphType: "support_journey",
    nodeType: "ServicePlan",
    participantId,
    label: title,
    status: "draft",
    data: { requiresParticipantConfirmationBeforeBooking: true },
    createdBy,
  });
  for (const recId of recommendationIds) {
    await graphRepository.createEdge({
      graphType: "support_journey",
      edgeType: "ADDRESSES_NEED",
      fromNodeId: plan.id,
      toNodeId: recId,
      participantId,
      createdBy,
    });
  }
  return plan;
}

export async function linkServicePlanToBookings(
  participantId: string,
  planNodeId: string,
  bookingNodeIds: string[]
) {
  for (const bookingId of bookingNodeIds) {
    await graphRepository.createEdge({
      graphType: "support_journey",
      edgeType: "LINKED_TO_BOOKING",
      fromNodeId: planNodeId,
      toNodeId: bookingId,
      participantId,
    });
    await graphRepository.createEdge({
      graphType: "booking",
      edgeType: "LINKED_TO_BOOKING",
      fromNodeId: bookingId,
      toNodeId: planNodeId,
      participantId,
    });
  }
}

export async function reviewSupportJourney(participantId: string) {
  const graph = await graphRepository.getGraphForParticipant(
    "support_journey",
    participantId
  );
  await graphRepository.createSnapshot({
    graphType: "support_journey",
    participantId,
    snapshot: graph as unknown as Record<string, unknown>,
    reason: "scheduled_review",
  });
  return graph;
}
