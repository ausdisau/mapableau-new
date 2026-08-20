import { mapableGoFlags, goFeatureDisabledResponse } from "@/lib/config/mapable-go";
import { getRoutePlanForUser } from "@/lib/go/route-service";
import { getSandboxGraph } from "@/lib/access/navigate";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { PlanRouteResponse, RouteOption } from "@/lib/go/contracts/route-contracts";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!mapableGoFlags.participantRoutesEnabled) {
    return goFeatureDisabledResponse("MAPABLE_GO_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;
  const plan = await getRoutePlanForUser(id, user.id);
  if (!plan) return jsonError("Route plan not found", 404);

  const url = new URL(req.url);
  const routeId = url.searchParams.get("routeId");
  const payload = plan.routePayload as PlanRouteResponse;
  const route = payload.routes.find((r: RouteOption) => r.routeId === routeId) ??
    payload.routes[0];

  if (!route) return jsonError("Route not found in plan", 404);

  const graph = getSandboxGraph();
  const segments = graph.segments.filter((s) => route.segmentIds.includes(s.id));

  return jsonOk({
    routeId: route.routeId,
    isLiveEvidence: false,
    graphSource: graph.label,
    segments: segments.map((s) => ({
      id: s.id,
      lengthMetres: s.lengthMetres,
      widthMm: s.widthMm,
      longitudinalSlopePercent: s.longitudinalSlopePercent,
      surfaceType: s.surfaceType,
      confidence: s.confidence,
      sourceClass: s.sourceClass,
      lastObservedAt: s.lastObservedAt,
      lastHumanVerifiedAt: s.lastHumanVerifiedAt,
      stairs: s.stairs,
      curbCut: s.curbCut,
    })),
  });
}
