import { NextResponse } from "next/server";

import {
  AccessGraphError,
  getPlaceAccessGraph,
} from "@/lib/access/infrastructure/observation-service";
import { toPublicAccessObservation } from "@/lib/access/infrastructure/public-observation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ placeId: string }> };

/**
 * GET /api/access-infrastructure/graph/places/[placeId]
 * Place-scoped Access Graph read with provenance + freshness on every assertion.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { placeId } = await context.params;
    const graph = await getPlaceAccessGraph(placeId);
    return NextResponse.json({
      framework: "access_as_infrastructure",
      epic: "mapable-epic-01-access-graph",
      ...graph,
      observations: graph.observations.map(toPublicAccessObservation),
    });
  } catch (err) {
    if (err instanceof AccessGraphError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
