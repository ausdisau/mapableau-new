import { getPlaceById } from "@/lib/access/map/access-place-service";
import {
  buildExplanation,
  findNearestNode,
  getSandboxGraph,
  planAccessibleRoutes,
} from "@/lib/access/navigate";
import type { RouteObjective } from "@/lib/access/navigate/types";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type {
  MobilityRoutingProfile,
  PlanRouteRequest,
  PlanRouteResponse,
  RouteOption,
} from "@/lib/go/contracts/route-contracts";
import { prisma } from "@/lib/prisma";

import { profileToConstraints } from "./profile-service";

export async function loadActiveBarriers(graphId: string) {
  const now = new Date();
  const rows = await prisma.accessTemporaryBarrier.findMany({
    where: {
      graphId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  return rows.map((b) => ({
    id: b.id,
    segmentId: b.segmentExternalId,
    type: b.type,
    reportedAt: b.reportedAt.toISOString(),
    expiresAt: b.expiresAt?.toISOString() ?? null,
    confidence: b.confidence,
    verificationState: "community_reported" as const,
  }));
}

export async function planNavigateRoutes(
  input: PlanRouteRequest & { profile?: MobilityRoutingProfile | null },
): Promise<PlanRouteResponse> {
  const graph = getSandboxGraph();
  const constraints = profileToConstraints(input.profile);
  const barriers = await loadActiveBarriers(graph.graphId);

  let destLat = input.destinationLat;
  let destLng = input.destinationLng;

  if (input.destinationPlaceId) {
    const place = await getPlaceById(input.destinationPlaceId);
    if (place?.location) {
      destLat = place.location.latitude;
      destLng = place.location.longitude;
    }
  }

  if (destLat == null || destLng == null) {
    throw new Error("Destination coordinates or place id required");
  }

  const fromNode = findNearestNode(graph, input.originLat, input.originLng);
  const toNode = findNearestNode(graph, destLat, destLng);

  const objectives = (input.objectives ?? [
    "FASTEST",
    "LOWEST_GRADIENT",
    "MOST_VERIFIED",
  ]) as RouteObjective[];

  const result = planAccessibleRoutes({
    graph,
    fromNodeId: fromNode.id,
    toNodeId: toNode.id,
    constraints,
    barriers,
    objectives,
  });

  const routes: RouteOption[] = result.paths.map(({ objective, path, segments }, idx) => {
    const routeId = `route-${objective.toLowerCase()}-${idx}`;
    const explanation = buildExplanation({
      routeId,
      objective,
      segments,
      distanceMetres: path.totalDistanceMetres,
      durationMinutes: path.totalDurationMinutes,
      temporaryBarriers: barriers.filter((b) =>
        path.segmentIds.includes(b.segmentId),
      ).length,
      alternativeObjectives: objectives.filter((o) => o !== objective),
    });

    return {
      routeId,
      objective,
      distanceMetres: path.totalDistanceMetres,
      durationMinutes: path.totalDurationMinutes,
      accessibility: {
        confidence: explanation.confidence,
        evidenceCoverage: explanation.evidenceCoverage,
        maximumSlopePercent: explanation.maximumSlopePercent,
        minimumWidthMm: explanation.minimumWidthMm,
        stairs: explanation.stairs,
        unknownSegments: explanation.unknownSegments,
        temporaryBarriers: explanation.temporaryBarriers,
        lastVerified: explanation.lastVerified,
      },
      surfaceSummary: explanation.surfaceSummary.map((s) => ({
        type: s.type as RouteOption["surfaceSummary"][0]["type"],
        percent: s.percent,
      })),
      warnings: explanation.warnings,
      explanation: explanation.explanation,
      segmentIds: path.segmentIds,
    };
  });

  return {
    routes,
    graphSource: graph.label,
    isLiveEvidence: false,
  };
}

export async function persistRoutePlan(params: {
  userId: string;
  destinationPlaceId?: string;
  response: PlanRouteResponse;
  passportId?: string;
}) {
  const plan = await prisma.goRoutePlan.create({
    data: {
      userId: params.userId,
      passportId: params.passportId,
      destinationPlaceId: params.destinationPlaceId,
      graphSource: params.response.graphSource,
      isLiveEvidence: false,
      routePayload: params.response,
      status: "planned",
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "GO_ROUTE_REQUESTED",
    entityType: "GoRoutePlan",
    entityId: plan.id,
    participantId: params.userId,
    metadata: {
      routeCount: params.response.routes.length,
      graphSource: params.response.graphSource,
      destinationPlaceId: params.destinationPlaceId,
    },
  });

  return plan;
}

export async function getRoutePlanForUser(planId: string, userId: string) {
  return prisma.goRoutePlan.findFirst({
    where: { id: planId, userId },
  });
}

export async function selectRouteOption(params: {
  planId: string;
  userId: string;
  routeId: string;
}) {
  const plan = await getRoutePlanForUser(params.planId, params.userId);
  if (!plan) return null;

  const updated = await prisma.goRoutePlan.update({
    where: { id: plan.id },
    data: {
      selectedRouteId: params.routeId,
      status: "selected",
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "GO_ROUTE_SELECTED",
    entityType: "GoRoutePlan",
    entityId: plan.id,
    participantId: params.userId,
    metadata: { selectedRouteId: params.routeId },
  });

  return updated;
}

export async function reroutePlan(params: {
  planId: string;
  userId: string;
  originLat: number;
  originLng: number;
  profile?: MobilityRoutingProfile | null;
}) {
  const plan = await getRoutePlanForUser(params.planId, params.userId);
  if (!plan) return null;

  const response = await planNavigateRoutes({
    originLat: params.originLat,
    originLng: params.originLng,
    destinationPlaceId: plan.destinationPlaceId ?? undefined,
    profile: params.profile ?? undefined,
  });

  const updated = await prisma.goRoutePlan.update({
    where: { id: plan.id },
    data: {
      routePayload: response,
      status: "rerouted",
      selectedRouteId: null,
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "GO_REROUTE_REQUESTED",
    entityType: "GoRoutePlan",
    entityId: plan.id,
    participantId: params.userId,
    metadata: { routeCount: response.routes.length },
  });

  return { plan: updated, response };
}
