import { describe, expect, it } from "vitest";

import {
  assertNoParticipantRanking,
  buildThinMarketSignals,
  suppressSmallCells,
} from "@/lib/access-intelligence/regional";

describe("System 7 regional control tower", () => {
  it("suppresses small cells", () => {
    const { visible, suppressedKeys } = suppressSmallCells([
      { count: 2 },
      { count: 12 },
    ]);
    expect(visible).toHaveLength(1);
    expect(suppressedKeys).toBe(1);
  });

  it("builds aggregate signals without ranking fields", () => {
    expect(() => assertNoParticipantRanking({ worthiness: 1 })).toThrow();
    const signals = buildThinMarketSignals({
      hubId: "nsw",
      cells: [
        {
          key: "region-a",
          count: 15,
          gapCodes: ["accessible_vehicle_unavailable", "venue_access_unknown"],
        },
      ],
    });
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0]?.summary).toMatch(/Demand signal/);
  });
});
