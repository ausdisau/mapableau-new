import { describe, expect, it } from "vitest";

import { projectOperationalStatus } from "@/lib/accessops/status/status-projection";

describe("AccessOps status projection", () => {
  it("treats missing status as stale and unavailable", () => {
    const status = projectOperationalStatus([]);
    expect(status.state).toBe("stale");
    expect(status.available).toBe(false);
    expect(status.reason).toBe("missing_status_updates");
  });

  it("projects fresh verified availability", () => {
    const status = projectOperationalStatus(
      [
        {
          assetId: "asset-1",
          state: "verified_available",
          sourceType: "operator",
          confidence: 1,
          effectiveFrom: new Date("2026-01-01T00:00:00Z"),
          expectedUntil: null,
          freshnessWindowSeconds: 3600,
          reasonCode: "normal_operation",
        },
      ],
      new Date("2026-01-01T00:10:00Z"),
    );
    expect(status.available).toBe(true);
    expect(status.stale).toBe(false);
  });
});
