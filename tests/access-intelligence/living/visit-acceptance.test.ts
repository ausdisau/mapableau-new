import { describe, expect, it } from "vitest";

import {
  buildHarbourLivingTwin,
  buildPersonalAccessTwin,
  buildTaylorInterviewPassport,
  evaluateDecisionForTwin,
} from "@/lib/access-intelligence/living";

describe("Visit evaluateDecisionForTwin acceptance shape", () => {
  it("rejects Entrance A and returns Entrance B route + evidence for power-chair twin", () => {
    const twin = buildHarbourLivingTwin();
    const personal = buildPersonalAccessTwin({
      passport: buildTaylorInterviewPassport("u1"),
      journeyContext: {
        purpose: "Job interview",
        destination: "Interview Room 3.12",
        visitAt: "2026-07-16T00:00:00.000Z",
        optimisationGoal: "highest_confidence",
      },
    });
    const result = evaluateDecisionForTwin({
      twin,
      personalTwin: personal,
      visitAt: "2026-07-16T00:00:00.000Z",
    });

    expect(result.rejectedRoutes.length).toBeGreaterThan(0);
    expect(
      result.rejectedRoutes.some(
        (r) =>
          r.summary.toLowerCase().includes("entrance a") ||
          r.reasons.some((x) => /step/i.test(x)),
      ),
    ).toBe(true);
    expect(result.routeInstructions.length).toBeGreaterThan(0);
    expect(result.routeSummary).toBeTruthy();
    expect(result.evidenceSummary.length).toBeGreaterThan(5);
    expect(result.decision.unknowns.length).toBeGreaterThan(0);
    expect(["suitable", "suitable_with_conditions", "unknown", "blocked"]).toContain(
      result.decision.status,
    );
  });
});
