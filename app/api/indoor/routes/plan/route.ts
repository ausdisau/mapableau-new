import { z } from "zod";

import { getDemoFloorPlanDetail } from "@/lib/demo/floor-plan-fixture";
import { featureDisabledResponse } from "@/lib/indoor-accessibility/api-errors";
import { isIndoorFeatureEnabled } from "@/lib/indoor-accessibility/feature-flags";
import {
  IN_MEMORY_ENGINE,
} from "@/lib/indoor-accessibility/routing/pgrouting-adapter";
import { toRouteGeoJson } from "@/lib/indoor-accessibility/routing/route-geojson";
import {
  planIndoorRoute,
  resolveModeFromMobility,
  type MobilityProfile,
} from "@/lib/indoor-accessibility/routing/route-planner";
import {
  indoorRouteGraphSchema,
  routeModeSchema,
} from "@/lib/indoor-accessibility/schemas/core";

const mobilityProfileSchema = z.object({
  excludeStairs: z.boolean().optional(),
  gradientPenalty: z.number().min(1).optional(),
  surfaceFriction: z.number().min(1).optional(),
  minDoorWidthMm: z.number().positive().optional(),
});

const routeRequestSchema = z
  .object({
    startNodeId: z.string().optional(),
    endNodeId: z.string().optional(),
    // Backward-compat aliases for current clients
    fromNodeId: z.string().optional(),
    toNodeId: z.string().optional(),
    mobilityProfile: mobilityProfileSchema.optional(),
    graph: indoorRouteGraphSchema.optional(),
    placeId: z.string().optional(),
    floorPlanId: z.string().optional(),
    mode: routeModeSchema.optional(),
    minDoorWidthMm: z.number().optional(),
    unavailableEdgeIds: z.array(z.string()).optional(),
  })
  .superRefine((val, ctx) => {
    const start = val.startNodeId ?? val.fromNodeId;
    const end = val.endNodeId ?? val.toNodeId;
    if (!start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "startNodeId (or fromNodeId) is required",
        path: ["startNodeId"],
      });
    }
    if (!end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endNodeId (or toNodeId) is required",
        path: ["endNodeId"],
      });
    }
  });

function resolveGraph(input: {
  graph?: z.infer<typeof indoorRouteGraphSchema>;
  placeId?: string;
  floorPlanId?: string;
}) {
  if (input.graph) return input.graph;
  const placeId = input.placeId ?? "demo-parramatta-library";
  const floorPlanId = input.floorPlanId ?? "demo-parramatta-ground";
  return getDemoFloorPlanDetail(placeId, floorPlanId)?.plan.routeGraph ?? null;
}

export async function POST(request: Request) {
  if (!isIndoorFeatureEnabled("verifiedIndoorRouting")) {
    return featureDisabledResponse("verifiedIndoorRouting");
  }
  const body = await request.json();
  const parsed = routeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid route request" }, { status: 400 });
  }

  const data = parsed.data;
  const startNodeId = (data.startNodeId ?? data.fromNodeId)!;
  const endNodeId = (data.endNodeId ?? data.toNodeId)!;

  const graph = resolveGraph(data);
  if (!graph) {
    return Response.json(
      { error: "Route graph not available for place/floor plan" },
      { status: 404 },
    );
  }

  const mobility: MobilityProfile | undefined = data.mobilityProfile
    ? {
        ...data.mobilityProfile,
        minDoorWidthMm:
          data.mobilityProfile.minDoorWidthMm ?? data.minDoorWidthMm,
      }
    : data.minDoorWidthMm
      ? { minDoorWidthMm: data.minDoorWidthMm }
      : undefined;

  const resolved = resolveModeFromMobility(mobility, data.mode);

  const result = planIndoorRoute({
    graph,
    fromNodeId: startNodeId,
    toNodeId: endNodeId,
    mode: resolved.mode,
    minDoorWidthMm: resolved.minDoorWidthMm ?? data.minDoorWidthMm,
    mobilityProfile: mobility,
    unavailableEdgeIds: data.unavailableEdgeIds
      ? new Set(data.unavailableEdgeIds)
      : undefined,
  });

  const meta = {
    found: result.found,
    engine: IN_MEMORY_ENGINE,
    mode: resolved.mode,
    startNodeId,
    endNodeId,
    totalDistanceMetres: result.found ? result.totalDistanceMetres : undefined,
    trustWarning: result.found ? result.trustWarning : undefined,
    reasons: result.found ? undefined : result.reasons,
  };

  if (!result.found) {
    return Response.json({
      type: "FeatureCollection",
      features: [],
      meta,
      // Backward-compat for existing clients
      result,
    });
  }

  const geojson = toRouteGeoJson(result, graph, resolved.mode);

  return Response.json({
    ...geojson,
    meta,
    // Backward-compat for existing clients
    result,
  });
}
