import type {
  AccessDependencyCriticality,
  AccessEvidenceLevel,
  AccessTwinEdge,
  AccessTwinEdgeType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

import type { AccessTwinRouteEdge, JsonObject } from "../types";
import { isRestrictedClassification } from "../types";

export interface CreateTwinEdgeInput {
  fromAssetId: string;
  toAssetId: string;
  edgeType: AccessTwinEdgeType;
  sourceReference: string;
  direction?: "directed" | "undirected";
  conditions?: JsonObject | null;
  accessibilityConstraints?: JsonObject | null;
  minimumClearance?: number | null;
  maximumGradient?: number | null;
  timeRestriction?: JsonObject | null;
  dependencyCriticality?: AccessDependencyCriticality;
  evidenceLevel?: AccessEvidenceLevel;
  securityClassification?:
    | "public"
    | "internal"
    | "restricted"
    | "security_sensitive";
  validUntil?: Date | null;
}

export async function createTwinEdge(
  input: CreateTwinEdgeInput,
): Promise<AccessTwinEdge> {
  return prisma.accessTwinEdge.create({
    data: {
      fromAssetId: input.fromAssetId,
      toAssetId: input.toAssetId,
      edgeType: input.edgeType,
      direction: input.direction ?? "directed",
      conditions: input.conditions ? asJson(input.conditions) : undefined,
      accessibilityConstraints: input.accessibilityConstraints
        ? asJson(input.accessibilityConstraints)
        : undefined,
      minimumClearance: input.minimumClearance ?? null,
      maximumGradient: input.maximumGradient ?? null,
      timeRestriction: input.timeRestriction
        ? asJson(input.timeRestriction)
        : undefined,
      dependencyCriticality: input.dependencyCriticality ?? "optional",
      sourceReference: input.sourceReference,
      evidenceLevel: input.evidenceLevel ?? "unknown",
      securityClassification: input.securityClassification ?? "public",
      validUntil: input.validUntil ?? null,
    },
  });
}

export function toRouteEdge(edge: AccessTwinEdge): AccessTwinRouteEdge | null {
  if (isRestrictedClassification(edge.securityClassification)) return null;
  return {
    id: edge.id,
    fromAssetId: edge.fromAssetId,
    toAssetId: edge.toAssetId,
    edgeType: edge.edgeType,
    direction: edge.direction,
    securityClassification: edge.securityClassification,
    accessibilityConstraints:
      typeof edge.accessibilityConstraints === "object" &&
      edge.accessibilityConstraints !== null &&
      !Array.isArray(edge.accessibilityConstraints)
        ? edge.accessibilityConstraints
        : null,
    minimumClearance: edge.minimumClearance,
    maximumGradient: edge.maximumGradient,
    validUntil: edge.validUntil,
  };
}
