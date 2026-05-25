import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  GraphEdge,
  GraphEvent,
  GraphNode,
  GraphQueryResult,
  GraphSnapshot,
  GraphType,
} from "@/lib/mapable-graphs/types";

function toNumber(value: Prisma.Decimal | null | undefined): number | undefined {
  if (value == null) return undefined;
  return Number(value);
}

function mapNode(row: {
  id: string;
  graphType: string;
  nodeType: string;
  entityId: string | null;
  participantId: string | null;
  label: string;
  status: string | null;
  dataJson: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): GraphNode {
  return {
    id: row.id,
    graphType: row.graphType as GraphType,
    nodeType: row.nodeType as GraphNode["nodeType"],
    entityId: row.entityId ?? undefined,
    participantId: row.participantId ?? undefined,
    label: row.label,
    status: row.status ?? undefined,
    data: (row.dataJson as Record<string, unknown>) ?? {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapEdge(row: {
  id: string;
  graphType: string;
  edgeType: string;
  fromNodeId: string;
  toNodeId: string;
  participantId: string | null;
  confidence: Prisma.Decimal | null;
  weight: Prisma.Decimal | null;
  dataJson: Prisma.JsonValue;
  createdAt: Date;
}): GraphEdge {
  return {
    id: row.id,
    graphType: row.graphType as GraphType,
    edgeType: row.edgeType as GraphEdge["edgeType"],
    fromNodeId: row.fromNodeId,
    toNodeId: row.toNodeId,
    participantId: row.participantId ?? undefined,
    confidence: toNumber(row.confidence),
    weight: toNumber(row.weight),
    data: (row.dataJson as Record<string, unknown>) ?? {},
    createdAt: row.createdAt.toISOString(),
  };
}

export class GraphRepository {
  async createNode(input: {
    graphType: GraphType;
    nodeType: string;
    label: string;
    entityId?: string;
    participantId?: string;
    status?: string;
    data?: Record<string, unknown>;
    createdBy?: string;
  }): Promise<GraphNode> {
    const row = await prisma.graphNode.create({
      data: {
        graphType: input.graphType,
        nodeType: input.nodeType,
        label: input.label,
        entityId: input.entityId,
        participantId: input.participantId,
        status: input.status,
        dataJson: (input.data ?? {}) as Prisma.InputJsonValue,
        createdBy: input.createdBy,
      },
    });
    return mapNode(row);
  }

  async updateNode(
    id: string,
    input: {
      label?: string;
      status?: string;
      data?: Record<string, unknown>;
    }
  ): Promise<GraphNode> {
    const existing = await prisma.graphNode.findUniqueOrThrow({ where: { id } });
    const mergedData = input.data
      ? { ...(existing.dataJson as object), ...input.data }
      : existing.dataJson;
    const row = await prisma.graphNode.update({
      where: { id },
      data: {
        label: input.label,
        status: input.status,
        dataJson: mergedData as Prisma.InputJsonValue,
      },
    });
    return mapNode(row);
  }

  async getNode(id: string): Promise<GraphNode | null> {
    const row = await prisma.graphNode.findUnique({ where: { id } });
    return row ? mapNode(row) : null;
  }

  async findNodes(filter: {
    graphType?: GraphType;
    participantId?: string;
    nodeType?: string;
    status?: string;
    entityId?: string;
  }): Promise<GraphNode[]> {
    const rows = await prisma.graphNode.findMany({
      where: {
        graphType: filter.graphType,
        participantId: filter.participantId,
        nodeType: filter.nodeType,
        status: filter.status,
        entityId: filter.entityId,
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(mapNode);
  }

  async createEdge(input: {
    graphType: GraphType;
    edgeType: string;
    fromNodeId: string;
    toNodeId: string;
    participantId?: string;
    confidence?: number;
    weight?: number;
    data?: Record<string, unknown>;
    createdBy?: string;
  }): Promise<GraphEdge> {
    const row = await prisma.graphEdge.create({
      data: {
        graphType: input.graphType,
        edgeType: input.edgeType,
        fromNodeId: input.fromNodeId,
        toNodeId: input.toNodeId,
        participantId: input.participantId,
        confidence: input.confidence,
        weight: input.weight,
        dataJson: (input.data ?? {}) as Prisma.InputJsonValue,
        createdBy: input.createdBy,
      },
    });
    return mapEdge(row);
  }

  async deleteEdge(id: string): Promise<void> {
    await prisma.graphEdge.delete({ where: { id } });
  }

  async findEdges(filter: {
    graphType?: GraphType;
    participantId?: string;
    edgeType?: string;
    fromNodeId?: string;
    toNodeId?: string;
  }): Promise<GraphEdge[]> {
    const rows = await prisma.graphEdge.findMany({
      where: {
        graphType: filter.graphType,
        participantId: filter.participantId,
        edgeType: filter.edgeType,
        fromNodeId: filter.fromNodeId,
        toNodeId: filter.toNodeId,
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapEdge);
  }

  async getGraphForParticipant(
    graphType: GraphType,
    participantId: string
  ): Promise<GraphQueryResult> {
    const [nodes, edges] = await Promise.all([
      this.findNodes({ graphType, participantId }),
      this.findEdges({ graphType, participantId }),
    ]);
    return { graphType, participantId, nodes, edges };
  }

  async getNeighbourhood(
    nodeId: string,
    depth = 1
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const visitedNodes = new Set<string>([nodeId]);
    const collectedEdges: GraphEdge[] = [];
    let frontier = [nodeId];

    for (let d = 0; d < depth; d++) {
      const nextFrontier: string[] = [];
      for (const nid of frontier) {
        const edges = await prisma.graphEdge.findMany({
          where: { OR: [{ fromNodeId: nid }, { toNodeId: nid }] },
        });
        for (const e of edges) {
          const mapped = mapEdge(e);
          if (!collectedEdges.some((x) => x.id === mapped.id)) {
            collectedEdges.push(mapped);
          }
          const other = e.fromNodeId === nid ? e.toNodeId : e.fromNodeId;
          if (!visitedNodes.has(other)) {
            visitedNodes.add(other);
            nextFrontier.push(other);
          }
        }
      }
      frontier = nextFrontier;
    }

    const nodeRows = await prisma.graphNode.findMany({
      where: { id: { in: [...visitedNodes] } },
    });
    return { nodes: nodeRows.map(mapNode), edges: collectedEdges };
  }

  async recordGraphEvent(input: {
    graphType: GraphType;
    eventType: string;
    participantId?: string;
    relatedNodeId?: string;
    relatedEdgeId?: string;
    actorType?: string;
    actorId?: string;
    payload?: Record<string, unknown>;
  }): Promise<GraphEvent> {
    const row = await prisma.graphEvent.create({
      data: {
        graphType: input.graphType,
        eventType: input.eventType,
        participantId: input.participantId,
        relatedNodeId: input.relatedNodeId,
        relatedEdgeId: input.relatedEdgeId,
        actorType: input.actorType,
        actorId: input.actorId,
        payloadJson: (input.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
    return {
      id: row.id,
      graphType: row.graphType as GraphType,
      participantId: row.participantId ?? undefined,
      eventType: row.eventType,
      relatedNodeId: row.relatedNodeId ?? undefined,
      relatedEdgeId: row.relatedEdgeId ?? undefined,
      actorType: row.actorType ?? undefined,
      actorId: row.actorId ?? undefined,
      payload: (row.payloadJson as Record<string, unknown>) ?? {},
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createSnapshot(input: {
    graphType: GraphType;
    participantId: string;
    snapshot: Record<string, unknown>;
    reason?: string;
  }): Promise<GraphSnapshot> {
    const row = await prisma.graphSnapshot.create({
      data: {
        graphType: input.graphType,
        participantId: input.participantId,
        snapshotJson: input.snapshot as Prisma.InputJsonValue,
        reason: input.reason,
      },
    });
    return {
      id: row.id,
      graphType: row.graphType as GraphType,
      participantId: row.participantId,
      snapshot: row.snapshotJson as Record<string, unknown>,
      reason: row.reason ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getLatestSnapshot(
    graphType: GraphType,
    participantId: string
  ): Promise<GraphSnapshot | null> {
    const row = await prisma.graphSnapshot.findFirst({
      where: { graphType, participantId },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return null;
    return {
      id: row.id,
      graphType: row.graphType as GraphType,
      participantId: row.participantId,
      snapshot: row.snapshotJson as Record<string, unknown>,
      reason: row.reason ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

export const graphRepository = new GraphRepository();
