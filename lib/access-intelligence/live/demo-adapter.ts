import type { LiveStatusAdapter, LiveStatusObservation, LiveStatusQuery } from "@/lib/access-intelligence/live/types";
import { HARBOUR_PLACE_ID } from "@/lib/access-intelligence/living/harbour-civic";

/**
 * Demo / synthetic BMS adapter for Harbour Civic western lift and toilet ops.
 * Used when ACCESS_INTELLIGENCE_DEMO_MODE is on, or as a local fallback feed.
 */
export class DemoLiveStatusAdapter implements LiveStatusAdapter {
  readonly id = "demo-harbour-bms";
  readonly kind = "demo" as const;

  async fetchObservations(query: LiveStatusQuery): Promise<LiveStatusObservation[]> {
    if (query.placeId !== HARBOUR_PLACE_ID) return [];

    const all: LiveStatusObservation[] = [
      {
        placeId: HARBOUR_PLACE_ID,
        subjectKind: "element",
        subjectId: "hcc-lift-west",
        status: "degraded",
        summary: "Western lift intermittent door sensor — BMS reports slower cycles.",
        observedAt: new Date().toISOString(),
        sourceKind: "demo",
        sourceId: "demo-bms-lift-west",
        confidence: 0.82,
        payload: { cycleMs: 14000, sensor: "door" },
      },
      {
        placeId: HARBOUR_PLACE_ID,
        subjectKind: "feature",
        subjectId: "f-hcc-toilet",
        status: "unknown",
        summary: "Accessible toilet ops telemetry not reporting.",
        observedAt: new Date().toISOString(),
        sourceKind: "demo",
        sourceId: "demo-bms-toilet",
        confidence: 0.4,
        payload: { telemetry: "offline" },
      },
    ];

    return all.filter((row) => {
      if (query.subjectKind && row.subjectKind !== query.subjectKind) return false;
      if (query.subjectId && row.subjectId !== query.subjectId) return false;
      return true;
    });
  }
}
