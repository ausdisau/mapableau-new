import { describe, expect, it } from "vitest";

import {
  listBlockedHardDependencies,
  projectStartingWorkDependencies,
} from "@/lib/mission-portfolio/projection";

describe("shared mission dependency projection", () => {
  it("projects Starting Work without claiming writers", () => {
    const projection = projectStartingWorkDependencies({
      journeyId: "jw-test-1",
      blocked: false,
      stepsCompleted: [
        "passport_selected",
        "consent_checked",
        "worker_fields_disclosed",
        "readiness_evaluated",
        "equipment_checked",
        "care_authorised",
        "transport_authorised",
      ],
    });

    expect(projection.writersInvoked).toEqual([]);
    expect(projection.productionClaim).toBe("none");
    expect(projection.projectionKey).toBe("starting_work:jw-test-1");
    expect(projection.nodes.some((n) => n.domain === "care")).toBe(true);
    expect(projection.nodes.some((n) => n.domain === "transport_trip")).toBe(
      true,
    );
    expect(projection.edges.length).toBeGreaterThan(0);
  });

  it("surfaces blocked equipment as a hard dependency", () => {
    const projection = projectStartingWorkDependencies({
      journeyId: "jw-equipment",
      blocked: true,
      failureMode: "equipment_breakdown",
      stepsCompleted: ["passport_selected", "consent_checked"],
    });

    const blocked = listBlockedHardDependencies(projection);
    expect(blocked.some((n) => n.domain === "equipment")).toBe(true);
  });

  it("preserves source record refs without inventing live ids", () => {
    const projection = projectStartingWorkDependencies({
      journeyId: "jw-refs",
      blocked: false,
      stepsCompleted: ["care_authorised", "transport_authorised"],
    });
    const care = projection.nodes.find((n) => n.domain === "care");
    expect(care?.sourceRecordRef).toMatch(/^synthetic:/);
  });
});
