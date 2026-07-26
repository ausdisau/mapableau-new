import {
  getDemoFloorPlanDetail,
} from "@/lib/demo/floor-plan-fixture";
import type { FloorPlanDetail } from "@/lib/floor-plan/schemas";

export type EmbedFloorPlanBundle = {
  venueId: string;
  venueName: string;
  plan: FloorPlanDetail;
};

const DEFAULT_VENUE = "demo-parramatta-library";
const DEFAULT_FLOOR = "demo-parramatta-ground";

/**
 * Resolve a floor plan for the embed iframe.
 * Under FEATURE_FREEZE we serve the curated demo fixture for any location id
 * when a live venue floor plan is not available.
 */
export function resolveEmbedFloorPlan(locationId: string): EmbedFloorPlanBundle {
  const direct = getDemoFloorPlanDetail(locationId, DEFAULT_FLOOR);
  if (direct) {
    return {
      venueId: locationId,
      venueName: direct.venueName,
      plan: direct.plan,
    };
  }

  const byFloorId = getDemoFloorPlanDetail(DEFAULT_VENUE, locationId);
  if (byFloorId) {
    return {
      venueId: DEFAULT_VENUE,
      venueName: byFloorId.venueName,
      plan: byFloorId.plan,
    };
  }

  const fallback = getDemoFloorPlanDetail(DEFAULT_VENUE, DEFAULT_FLOOR)!;
  return {
    venueId: DEFAULT_VENUE,
    venueName: fallback.venueName,
    plan: fallback.plan,
  };
}
