/**
 * Wave 11 — Continuity Graph.
 *
 * Nodes are references to existing rows (participant, worker, provider,
 * booking, care request, appointment, housing, employment, funding). Edges
 * are typed dependencies with provenance. Adding a dependency MUST NOT
 * create a cycle. Cancellation NEVER auto-propagates through the graph — it
 * only opens signals/cases (see signal-service + case-service).
 */

import type {
  ContinuityDependency,
  ContinuityDependencyKind,
  ContinuityNodeKind,
  ContinuityNodeReference,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export interface UpsertNodeInput {
  organisationId?: string | null;
  participantId?: string | null;
  kind: ContinuityNodeKind;
  referenceKey: string;
  label: string;
  metadataJson?: Record<string, unknown>;
}

export async function upsertContinuityNode(input: UpsertNodeInput): Promise<ContinuityNodeReference> {
  return prisma.continuityNodeReference.upsert({
    where: {
      kind_referenceKey: { kind: input.kind, referenceKey: input.referenceKey },
    },
    update: {
      label: input.label,
      metadataJson: asJson(input.metadataJson ?? undefined),
      organisationId: input.organisationId ?? undefined,
      participantId: input.participantId ?? undefined,
    },
    create: {
      kind: input.kind,
      referenceKey: input.referenceKey,
      label: input.label,
      organisationId: input.organisationId ?? null,
      participantId: input.participantId ?? null,
      metadataJson: asJson(input.metadataJson ?? undefined),
    },
  });
}

export interface UpsertDependencyInput {
  fromNodeId: string;
  toNodeId: string;
  kind: ContinuityDependencyKind;
  provenance: string;
  weight?: number;
  detailsJson?: Record<string, unknown>;
}

export async function upsertContinuityDependency(
  input: UpsertDependencyInput
): Promise<ContinuityDependency> {
  if (input.fromNodeId === input.toNodeId) {
    throw new Error("GRAPH_SELF_LOOP");
  }

  // Cycle detection: BFS from `toNodeId` looking for `fromNodeId`.
  const wouldCycle = await createsCycle(input.fromNodeId, input.toNodeId);
  if (wouldCycle) {
    throw new Error("GRAPH_CYCLE_DETECTED");
  }

  return prisma.continuityDependency.upsert({
    where: {
      fromNodeId_toNodeId_kind: {
        fromNodeId: input.fromNodeId,
        toNodeId: input.toNodeId,
        kind: input.kind,
      },
    },
    update: {
      provenance: input.provenance,
      weight: input.weight ?? undefined,
      detailsJson: asJson(input.detailsJson ?? undefined),
    },
    create: {
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId,
      kind: input.kind,
      provenance: input.provenance,
      weight: input.weight ?? 1,
      detailsJson: asJson(input.detailsJson ?? undefined),
    },
  });
}

/**
 * Returns true if adding an edge from `fromId` -> `toId` would introduce a
 * cycle. We do a BFS from `toId` following outgoing edges and check whether
 * we can reach `fromId`. Depth is capped as a safety guard.
 */
export async function createsCycle(fromId: string, toId: string, maxDepth = 32): Promise<boolean> {
  const visited = new Set<string>();
  let frontier: string[] = [toId];
  let depth = 0;
  while (frontier.length > 0 && depth < maxDepth) {
    const edges = await prisma.continuityDependency.findMany({
      where: { fromNodeId: { in: frontier } },
      select: { toNodeId: true, fromNodeId: true },
    });
    const nextFrontier: string[] = [];
    for (const edge of edges) {
      if (edge.toNodeId === fromId) return true;
      if (visited.has(edge.toNodeId)) continue;
      visited.add(edge.toNodeId);
      nextFrontier.push(edge.toNodeId);
    }
    frontier = nextFrontier;
    depth++;
  }
  return false;
}

export interface GraphImpactNode {
  nodeId: string;
  kind: ContinuityNodeKind;
  referenceKey: string;
  distance: number;
}

/**
 * Given a starting node, walk downstream (following outgoing edges) to find
 * nodes that may be affected. This is a READ-ONLY graph traversal. It does
 * NOT propagate any cancellation or status change.
 */
export async function computeDownstreamImpactNodes(
  startNodeId: string,
  options: { maxDepth?: number } = {}
): Promise<GraphImpactNode[]> {
  const maxDepth = options.maxDepth ?? 16;
  const visited = new Map<string, number>();
  visited.set(startNodeId, 0);
  let frontier: string[] = [startNodeId];
  let depth = 0;
  const impactList: GraphImpactNode[] = [];

  while (frontier.length > 0 && depth < maxDepth) {
    const edges = await prisma.continuityDependency.findMany({
      where: { fromNodeId: { in: frontier } },
      select: { toNodeId: true },
    });
    const nextIds = Array.from(new Set(edges.map((e) => e.toNodeId).filter((id) => !visited.has(id))));
    if (nextIds.length === 0) break;
    const nodes = await prisma.continuityNodeReference.findMany({
      where: { id: { in: nextIds } },
      select: { id: true, kind: true, referenceKey: true },
    });
    for (const n of nodes) {
      visited.set(n.id, depth + 1);
      impactList.push({ nodeId: n.id, kind: n.kind, referenceKey: n.referenceKey, distance: depth + 1 });
    }
    frontier = nextIds;
    depth++;
  }

  return impactList;
}
