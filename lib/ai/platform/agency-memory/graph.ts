import { randomUUID } from "node:crypto";

import { getCategoryEntry } from "./registry";
import {
  getGraphEdges,
  listMemoryItems,
  saveGraphEdges,
} from "./store";
import type {
  MapAbleAgencyMemoryItem,
  PreferenceGraph,
  PreferenceGraphEdge,
  PreferenceGraphEdgeType,
  PreferenceGraphNode,
} from "./types";

/**
 * Preference / Decision Graph — explicit inspectable edges only.
 * Never infer edges from correlation or behavioural signals.
 */

function edgeTypeForItem(item: MapAbleAgencyMemoryItem): PreferenceGraphEdgeType {
  return getCategoryEntry(item.category).defaultEdgeType;
}

function targetLabel(item: MapAbleAgencyMemoryItem): string {
  if (
    item.structuredValue &&
    typeof item.structuredValue === "object" &&
    item.structuredValue !== null &&
    "target" in item.structuredValue
  ) {
    return String((item.structuredValue as { target: unknown }).target);
  }
  return item.statement.slice(0, 80);
}

export function rebuildPreferenceGraph(params: {
  participantId: string;
  tenantId: string;
}): PreferenceGraph {
  const items = listMemoryItems({
    participantId: params.participantId,
    tenantId: params.tenantId,
  });

  const participantNodeId = `participant:${params.participantId}`;
  const nodes: PreferenceGraphNode[] = [
    {
      nodeId: participantNodeId,
      kind: "participant",
      label: "You",
      participantId: params.participantId,
    },
  ];
  const edges: PreferenceGraphEdge[] = [];

  for (const item of items) {
    const memoryNodeId = `memory:${item.memoryId}`;
    nodes.push({
      nodeId: memoryNodeId,
      kind: "memory",
      label: item.statement.slice(0, 80),
      memoryId: item.memoryId,
      participantId: item.participantId,
    });

    const targetNodeId = `target:${item.memoryId}`;
    nodes.push({
      nodeId: targetNodeId,
      kind: "target",
      label: targetLabel(item),
      memoryId: item.memoryId,
    });

    const active = item.confirmationState === "confirmed";
    const edge: PreferenceGraphEdge = {
      edgeId: randomUUID(),
      type: edgeTypeForItem(item),
      fromNodeId: participantNodeId,
      toNodeId: targetNodeId,
      memoryId: item.memoryId,
      participantId: params.participantId,
      tenantId: params.tenantId,
      active,
      createdAt: item.confirmedAt ?? item.createdAt,
      explicit: true,
    };
    edges.push(edge);
  }

  saveGraphEdges(params.participantId, params.tenantId, edges);
  return {
    participantId: params.participantId,
    tenantId: params.tenantId,
    nodes,
    edges,
  };
}

export function getActivePreferenceGraph(params: {
  participantId: string;
  tenantId: string;
}): PreferenceGraph {
  const graph = rebuildPreferenceGraph(params);
  return {
    ...graph,
    edges: graph.edges.filter((e) => e.active),
    nodes: graph.nodes.filter(
      (n) =>
        n.kind === "participant" ||
        graph.edges.some(
          (e) =>
            e.active &&
            (e.fromNodeId === n.nodeId ||
              e.toNodeId === n.nodeId ||
              (n.memoryId && e.memoryId === n.memoryId)),
        ),
    ),
  };
}

export function listStoredEdges(params: {
  participantId: string;
  tenantId: string;
}): PreferenceGraphEdge[] {
  return getGraphEdges(params);
}

/** Correlation-based edge creation is forbidden — this always throws. */
export function inferEdgesFromCorrelation(): never {
  throw new Error("AGENCY_MEMORY_INFERRED_EDGES_FORBIDDEN");
}
