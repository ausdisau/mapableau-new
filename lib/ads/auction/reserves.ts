import {
  DEFAULT_PLACEMENT_FLOOR_CPM_MICROS,
} from "@/lib/ads/auction/config";
import type { AdsMicros } from "@/lib/ads/money/micros";
import type { PlacementCode } from "@/lib/ads/types";
import { isPlacementCode } from "@/lib/ads/placement-registry";

export type PlacementReserveSource = "default" | "rule" | "override";

export type PlacementReserveResult = {
  floorCpmMicros: AdsMicros;
  source: PlacementReserveSource;
};

/**
 * Central configuration resolver for placement reserve (floor) CPM.
 * Changing reserve must not affect accessibility, suitability, or organic rank.
 */
export function getPlacementReservePrice(
  placementCode: string,
  options?: {
    /** ruleValue from AdPlacementRule where ruleKey === floor_cpm_micros */
    ruleFloorCpmMicros?: string | null;
    /** explicit override (tests / admin preview) */
    overrideMicros?: AdsMicros | null;
  },
): PlacementReserveResult {
  if (options?.overrideMicros != null) {
    return { floorCpmMicros: options.overrideMicros, source: "override" };
  }

  if (options?.ruleFloorCpmMicros) {
    try {
      const parsed = BigInt(options.ruleFloorCpmMicros);
      if (parsed >= 0n) {
        return { floorCpmMicros: parsed, source: "rule" };
      }
    } catch {
      // fall through to default
    }
  }

  if (!isPlacementCode(placementCode)) {
    return { floorCpmMicros: 0n, source: "default" };
  }

  return {
    floorCpmMicros: DEFAULT_PLACEMENT_FLOOR_CPM_MICROS[placementCode as PlacementCode],
    source: "default",
  };
}
