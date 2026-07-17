/**
 * Wave 11 — Impact Assessment.
 *
 * Computes the affected nodes and broken dependencies for a continuity case.
 * READ-ONLY: producing an impact assessment does NOT modify any booking or
 * status. It is a report an approved recovery plan step can quote.
 */

import type {
  ContinuityCase,
  ContinuityImpactAssessment,
  ContinuityImpactLevel,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { computeDownstreamImpactNodes } from "@/lib/continuity/graph/graph-service";
import { asJsonArray } from "@/lib/prisma-json";

export interface ComputeImpactInput {
  caseId: string;
  startingNodeId?: string;
  computedById?: string | null;
}

function levelFromCounts(affected: number, broken: number): ContinuityImpactLevel {
  if (broken >= 5 || affected >= 12) return "critical";
  if (broken >= 3 || affected >= 6) return "significant";
  if (broken >= 1 || affected >= 3) return "moderate";
  if (affected >= 1) return "minor";
  return "none";
}

export async function computeAndStoreImpact(input: ComputeImpactInput): Promise<ContinuityImpactAssessment> {
  const caseRow = await prisma.continuityCase.findUnique({
    where: { id: input.caseId },
    include: { originatingSignals: true, impact: true },
  });
  if (!caseRow) throw new Error("CONTINUITY_CASE_NOT_FOUND");

  const affectedNodes = input.startingNodeId
    ? await computeDownstreamImpactNodes(input.startingNodeId)
    : [];

  const brokenDeps = affectedNodes.map((n) => ({
    nodeId: n.nodeId,
    kind: n.kind,
    reason: "downstream_of_starting_node",
    distance: n.distance,
  }));

  const level = levelFromCounts(affectedNodes.length, brokenDeps.length);

  if (caseRow.impact) {
    return prisma.continuityImpactAssessment.update({
      where: { id: caseRow.impact.id },
      data: {
        level,
        affectedNodesJson: asJsonArray(affectedNodes),
        brokenDependenciesJson: asJsonArray(brokenDeps),
        computedById: input.computedById ?? caseRow.impact.computedById,
        computedAt: new Date(),
      },
    });
  }

  return prisma.continuityImpactAssessment.create({
    data: {
      caseId: caseRow.id,
      participantId: caseRow.participantId,
      organisationId: caseRow.organisationId,
      level,
      affectedNodesJson: asJsonArray(affectedNodes),
      brokenDependenciesJson: asJsonArray(brokenDeps),
      computedById: input.computedById ?? null,
    },
  });
}
