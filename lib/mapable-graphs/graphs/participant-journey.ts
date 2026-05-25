import { graphRepository } from "@/lib/mapable-graphs/repository";
import type { ParticipantJourneyGraph } from "@/lib/mapable-graphs/types";

export async function createParticipantJourneyGraph(
  participantId: string,
  createdBy?: string
): Promise<ParticipantJourneyGraph> {
  const existing = await graphRepository.findNodes({
    graphType: "participant_journey",
    participantId,
    nodeType: "Participant",
  });
  if (!existing.length) {
    await graphRepository.createNode({
      graphType: "participant_journey",
      nodeType: "Participant",
      participantId,
      entityId: participantId,
      label: "Participant",
      status: "active",
      createdBy,
    });
    await graphRepository.recordGraphEvent({
      graphType: "participant_journey",
      participantId,
      eventType: "graph.created",
      actorId: createdBy,
      actorType: createdBy ? "user" : "system",
    });
  }
  return graphRepository.getGraphForParticipant(
    "participant_journey",
    participantId
  ) as Promise<ParticipantJourneyGraph>;
}

async function getParticipantNode(participantId: string) {
  const nodes = await graphRepository.findNodes({
    graphType: "participant_journey",
    participantId,
    nodeType: "Participant",
  });
  return nodes[0];
}

export async function addParticipantGoal(
  participantId: string,
  label: string,
  key?: string,
  createdBy?: string
) {
  await createParticipantJourneyGraph(participantId, createdBy);
  const participant = await getParticipantNode(participantId);
  const goal = await graphRepository.createNode({
    graphType: "participant_journey",
    nodeType: "Goal",
    participantId,
    label,
    status: "draft",
    entityId: key,
    data: { key: key ?? label.toLowerCase().replace(/\s+/g, "_") },
    createdBy,
  });
  if (participant) {
    await graphRepository.createEdge({
      graphType: "participant_journey",
      edgeType: "EXPRESSES",
      fromNodeId: participant.id,
      toNodeId: goal.id,
      participantId,
      createdBy,
    });
  }
  return goal;
}

export async function addParticipantPreference(
  participantId: string,
  label: string,
  createdBy?: string
) {
  await createParticipantJourneyGraph(participantId, createdBy);
  const participant = await getParticipantNode(participantId);
  const pref = await graphRepository.createNode({
    graphType: "participant_journey",
    nodeType: "Preference",
    participantId,
    label,
    status: "draft",
    createdBy,
  });
  if (participant) {
    await graphRepository.createEdge({
      graphType: "participant_journey",
      edgeType: "EXPRESSES",
      fromNodeId: participant.id,
      toNodeId: pref.id,
      participantId,
      createdBy,
    });
  }
  return pref;
}

export async function addFunctionalSignal(
  participantId: string,
  label: string,
  data?: Record<string, unknown>,
  createdBy?: string
) {
  await createParticipantJourneyGraph(participantId, createdBy);
  return graphRepository.createNode({
    graphType: "participant_journey",
    nodeType: "FunctionalSignal",
    participantId,
    label,
    status: "draft",
    data,
    createdBy,
  });
}

export async function addEnvironmentalBarrier(
  participantId: string,
  label: string,
  goalNodeId?: string,
  createdBy?: string
) {
  const barrier = await graphRepository.createNode({
    graphType: "participant_journey",
    nodeType: "EnvironmentalBarrier",
    participantId,
    label,
    status: "active",
    createdBy,
  });
  if (goalNodeId) {
    await graphRepository.createEdge({
      graphType: "participant_journey",
      edgeType: "CONSTRAINS",
      fromNodeId: barrier.id,
      toNodeId: goalNodeId,
      participantId,
      createdBy,
    });
  }
  return barrier;
}

export async function confirmInterpretation(
  participantId: string,
  nodeId: string,
  actorId?: string
) {
  const node = await graphRepository.updateNode(nodeId, {
    status: "participant_confirmed",
    data: { confirmedAt: new Date().toISOString(), confirmedBy: actorId },
  });
  await graphRepository.recordGraphEvent({
    graphType: "participant_journey",
    participantId,
    eventType: "interpretation.confirmed",
    relatedNodeId: nodeId,
    actorId,
    actorType: "participant",
  });
  return node;
}

export async function applyParticipantCorrection(
  participantId: string,
  nodeId: string,
  correction: Record<string, unknown>,
  actorId?: string
) {
  const node = await graphRepository.updateNode(nodeId, {
    status: "participant_corrected",
    data: correction,
  });
  await graphRepository.recordGraphEvent({
    graphType: "participant_journey",
    participantId,
    eventType: "interpretation.corrected",
    relatedNodeId: nodeId,
    actorId,
    actorType: "participant",
    payload: correction,
  });
  return node;
}
