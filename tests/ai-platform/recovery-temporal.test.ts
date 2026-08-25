import { describe, expect, it } from "vitest";
import {
  approvalExpired, computeTemporalConstraint, isDeadlineImpossible, minutesUntilDeadline,
} from "@/lib/ai/platform/recovery";

describe("Recovery temporal", () => {
  it("marks past deadline as impossible (scenario L)", () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const constraint = computeTemporalConstraint({
      nodeId: "node-job-interview", label: "Interview", deadlineIso: past,
      bufferMinutes: 30, leadTimeMinutes: 60,
    });
    expect(constraint.status).toBe("impossible");
    expect(isDeadlineImpossible([constraint])).toBe(true);
  });

  it("marks far-future deadline as feasible", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(computeTemporalConstraint({
      nodeId: "node-job-interview", label: "Interview", deadlineIso: future,
    }).status).toBe("feasible");
  });

  it("detects expired approvals", () => {
    expect(approvalExpired(new Date(Date.now() - 1000).toISOString())).toBe(true);
    expect(approvalExpired(null)).toBe(false);
  });

  it("computes minutes until deadline deterministically", () => {
    const ref = new Date("2026-08-24T12:00:00.000Z");
    expect(minutesUntilDeadline("2026-08-24T13:00:00.000Z", ref)).toBe(60);
  });

  it("returns unknown when no deadline", () => {
    expect(computeTemporalConstraint({
      nodeId: "n1", label: "Unknown", deadlineIso: null,
    }).status).toBe("unknown");
  });
});
