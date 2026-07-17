import { describe, expect, it } from "vitest";

import { materialJourneyChangeRequiresApproval } from "@/lib/accessops/journeys/reroute-policy";

describe("AccessOps reroute continuity", () => {
  it("requires approval for material journey changes", () => {
    expect(
      materialJourneyChangeRequiresApproval({
        addedTransfers: 1,
        removedCriticalAsset: false,
      }),
    ).toBe(true);
  });
});
