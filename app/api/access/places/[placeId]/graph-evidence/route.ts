import { NextResponse } from "next/server";

import {
  AccessExperienceDisabledError,
  assertAccessExperienceEnabled,
} from "@/lib/access/experience/flags";
import { projectAccessGraphEvidence } from "@/lib/access/experience/project-access-graph-evidence";
import {
  AccessGraphError,
  getPlaceAccessGraph,
} from "@/lib/access/infrastructure/observation-service";
import { getPlaceById } from "@/lib/access/map/access-place-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ placeId: string }> };

/**
 * Public-safe Access Graph projection for the canonical /access experience.
 * Internal observer and entity identifiers are deliberately omitted.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    assertAccessExperienceEnabled();

    const { placeId } = await context.params;
    const place = await getPlaceById(placeId, true);
    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    const graph = await getPlaceAccessGraph(placeId);

    return NextResponse.json({
      evidence: projectAccessGraphEvidence(graph),
    });
  } catch (error) {
    if (
      error instanceof AccessExperienceDisabledError ||
      error instanceof AccessGraphError
    ) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
