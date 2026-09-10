/**
 * Minimal Community Access Graph relationship helpers (PostgreSQL-first).
 * No Neo4j. Relationships are typed edges over existing Access concepts.
 */

import { z } from "zod";

export const ACCESS_GRAPH_NODE_KINDS = [
  "place",
  "entrance",
  "path",
  "crossing",
  "lift",
  "facility",
  "stop",
  "observation",
  "capability",
  "barrier",
  "journey",
] as const;

export type AccessGraphNodeKind = (typeof ACCESS_GRAPH_NODE_KINDS)[number];

export const ACCESS_GRAPH_EDGE_KINDS = [
  "has_entrance",
  "has_path",
  "has_crossing",
  "has_lift",
  "has_facility",
  "supported_by_observation",
  "has_barrier",
  "journey_depends_on",
  "stale_evidence_for",
  "missing_evidence_for",
] as const;

export type AccessGraphEdgeKind = (typeof ACCESS_GRAPH_EDGE_KINDS)[number];

export const accessGraphNodeSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(ACCESS_GRAPH_NODE_KINDS),
  })
  .strict();

export const accessGraphEdgeSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(ACCESS_GRAPH_EDGE_KINDS),
    fromId: z.string().min(1),
    toId: z.string().min(1),
  })
  .strict();

export type AccessGraphNode = z.infer<typeof accessGraphNodeSchema>;
export type AccessGraphEdge = z.infer<typeof accessGraphEdgeSchema>;

export type CommunityAccessGraphSlice = {
  nodes: AccessGraphNode[];
  edges: AccessGraphEdge[];
};

/** Build a minimal place→observation→capability slice for foundation tests. */
export function buildPlaceEvidenceSlice(input: {
  placeId: string;
  observationId: string;
  capabilityId?: string;
  barrierId?: string;
}): CommunityAccessGraphSlice {
  const nodes: AccessGraphNode[] = [
    { id: input.placeId, kind: "place" },
    { id: input.observationId, kind: "observation" },
  ];
  const edges: AccessGraphEdge[] = [
    {
      id: `${input.placeId}->obs:${input.observationId}`,
      kind: "supported_by_observation",
      fromId: input.placeId,
      toId: input.observationId,
    },
  ];
  if (input.capabilityId) {
    nodes.push({ id: input.capabilityId, kind: "capability" });
    edges.push({
      id: `${input.capabilityId}->obs:${input.observationId}`,
      kind: "supported_by_observation",
      fromId: input.capabilityId,
      toId: input.observationId,
    });
  }
  if (input.barrierId) {
    nodes.push({ id: input.barrierId, kind: "barrier" });
    edges.push({
      id: `${input.placeId}->barrier:${input.barrierId}`,
      kind: "has_barrier",
      fromId: input.placeId,
      toId: input.barrierId,
    });
  }
  return { nodes, edges };
}

export function listObservationsSupportingCapability(
  graph: CommunityAccessGraphSlice,
  capabilityId: string,
): string[] {
  return graph.edges
    .filter(
      (e) =>
        e.kind === "supported_by_observation" && e.fromId === capabilityId,
    )
    .map((e) => e.toId);
}
