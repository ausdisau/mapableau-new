import { graphRepository } from "@/lib/mapable-graphs/repository";
import {
  buildCPSimInputFromGraphs,
  evaluateBookingBufferWarnings,
} from "@/lib/mapable-graphs/sim-integration";
import type { BookingGraph } from "@/lib/mapable-graphs/types";

export async function createBookingGraphForSession(
  participantId: string,
  sessionId?: string
): Promise<BookingGraph> {
  await graphRepository.recordGraphEvent({
    graphType: "booking",
    participantId,
    eventType: "booking_session.created",
    payload: { sessionId: sessionId ?? `session-${Date.now()}` },
  });
  return graphRepository.getGraphForParticipant(
    "booking",
    participantId
  ) as Promise<BookingGraph>;
}

export async function addCareBookingDraft(
  participantId: string,
  label: string,
  data: Record<string, unknown> = {}
) {
  return graphRepository.createNode({
    graphType: "booking",
    nodeType: "CareBooking",
    participantId,
    label,
    status: "draft",
    data: { ...data, module: "care" },
  });
}

export async function addTransportBookingDraft(
  participantId: string,
  label: string,
  data: Record<string, unknown> = {}
) {
  return graphRepository.createNode({
    graphType: "booking",
    nodeType: "TransportBooking",
    participantId,
    label,
    status: "draft",
    data: { ...data, module: "transport" },
  });
}

export async function addEmploymentEvent(
  participantId: string,
  label: string,
  data: Record<string, unknown> = {}
) {
  return graphRepository.createNode({
    graphType: "booking",
    nodeType: "EmploymentEvent",
    participantId,
    label,
    status: "draft",
    data: { ...data, module: "employment" },
  });
}

export async function linkBookingDependency(
  participantId: string,
  fromNodeId: string,
  toNodeId: string,
  edgeType: "DEPENDS_ON" | "LINKED_TO_BOOKING" = "DEPENDS_ON"
) {
  return graphRepository.createEdge({
    graphType: "booking",
    edgeType,
    fromNodeId,
    toNodeId,
    participantId,
  });
}

export async function validateBookingDependencies(participantId: string) {
  const graph = await graphRepository.getGraphForParticipant(
    "booking",
    participantId
  );
  const warnings: string[] = [];
  const errors: string[] = [];

  const careNodes = graph.nodes.filter((n) => n.nodeType === "CareBooking");
  const transportNodes = graph.nodes.filter(
    (n) => n.nodeType === "TransportBooking"
  );

  if (careNodes.length && !transportNodes.length) {
    warnings.push("Care booking without linked transport may affect reliability.");
  }

  const cpsim = await buildCPSimInputFromGraphs(graphRepository, participantId);
  const bufferWarnings = evaluateBookingBufferWarnings(
    cpsim.bookings.map((b) => ({
      type: String(b.type),
      scheduledStart: b.scheduledStart as string | undefined,
      scheduledEnd: b.scheduledEnd as string | undefined,
    }))
  );
  warnings.push(...bufferWarnings);

  const dependsEdges = graph.edges.filter((e) => e.edgeType === "DEPENDS_ON");
  for (const edge of dependsEdges) {
    const from = graph.nodes.find((n) => n.id === edge.fromNodeId);
    const to = graph.nodes.find((n) => n.id === edge.toNodeId);
    if (!from || !to) {
      errors.push(`Broken dependency edge ${edge.id}`);
    }
  }

  return { valid: errors.length === 0, warnings, errors, graph };
}

export async function markBookingConfirmed(
  participantId: string,
  nodeId: string,
  actorId?: string
) {
  const node = await graphRepository.updateNode(nodeId, {
    status: "confirmed",
    data: { confirmedAt: new Date().toISOString() },
  });
  await graphRepository.recordGraphEvent({
    graphType: "booking",
    participantId,
    eventType: "booking.confirmed",
    relatedNodeId: nodeId,
    actorId,
    actorType: "participant",
  });
  return node;
}

export async function markBookingFailed(
  participantId: string,
  nodeId: string,
  reason: string
) {
  const node = await graphRepository.updateNode(nodeId, {
    status: "failed",
    data: { failureReason: reason },
  });
  await graphRepository.recordGraphEvent({
    graphType: "booking",
    participantId,
    eventType: "booking.failed",
    relatedNodeId: nodeId,
    payload: { reason },
  });
  return node;
}

export async function recordTimingIssue(
  participantId: string,
  nodeId: string,
  issue: string
) {
  await graphRepository.recordGraphEvent({
    graphType: "booking",
    participantId,
    eventType: "timing.issue",
    relatedNodeId: nodeId,
    payload: { issue },
  });
  const node = await graphRepository.getNode(nodeId);
  if (node) {
    await graphRepository.updateNode(nodeId, {
      data: { ...node.data, timingIssue: issue },
    });
  }
}
