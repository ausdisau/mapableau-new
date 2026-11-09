import { describe, expect, it } from "vitest";

import { buildDayContinuityReview } from "@/lib/day/continuity-review";
import { buildMyDaySnapshot } from "@/lib/dashboard/my-day-status";
import { participantWorkspaceFlags } from "@/lib/config/participant-workspace";

const now = new Date("2026-11-09T01:00:00.000Z");

describe("MapAble Day competitor-informed continuity pattern", () => {
  it("remains off unless the exact preview flag is true", () => {
    expect(participantWorkspaceFlags.dayContinuityReviewEnabled({})).toBe(false);
    expect(
      participantWorkspaceFlags.dayContinuityReviewEnabled({
        MAPABLE_DAY_CONTINUITY_REVIEW_ENABLED: "false",
      }),
    ).toBe(false);
    expect(
      participantWorkspaceFlags.dayContinuityReviewEnabled({
        MAPABLE_DAY_CONTINUITY_REVIEW_ENABLED: "true",
      }),
    ).toBe(true);
  });

  it("surfaces a cancelled care shift even if the summary says confirmed", () => {
    const snapshot = buildMyDaySnapshot({
      now,
      care: [
        { id: "accepted", status: "accepted", title: "Later care", scheduledStartAt: now },
        { id: "cancelled", status: "cancelled", title: "Morning care", scheduledStartAt: now },
      ],
      transport: [],
    });
    expect(snapshot.careSummary.status).toBe("confirmed");
    const review = buildDayContinuityReview(snapshot);
    expect(review.issues).toEqual([
      expect.objectContaining({
        id: "care-cancelled",
        title: "Morning care",
        sourceStatus: "cancelled",
        priority: "needs-action",
      }),
    ]);
    expect(review.suggestedHumanReview).toBe(true);
  });

  it("surfaces transport disruption without cancelling unrelated care", () => {
    const snapshot = buildMyDaySnapshot({
      now,
      care: [{ id: "care", status: "accepted", title: "Personal support" }],
      transport: [{ id: "trip", status: "driver_no_show", scheduledStart: now }],
    });
    const review = buildDayContinuityReview(snapshot);
    expect(review.issues.map((item) => item.id)).toEqual(["transport-trip"]);
    expect(snapshot.careSummary.status).toBe("confirmed");
    expect(review.changesExternalRecords).toBe(false);
  });

  it("treats accepted shifts and trips as records, not whole-day readiness", () => {
    const snapshot = buildMyDaySnapshot({
      now,
      care: [{ id: "care", status: "worker_assigned", title: "Care" }],
      transport: [{ id: "trip", status: "driver_vehicle_assigned" }],
    });
    const review = buildDayContinuityReview(snapshot);
    expect(review.issues).toEqual([]);
    expect(review.readiness).toBe("not_assessed");
    expect(review.evidenceChecks.every((check) => check.finding === "not_assessed")).toBe(true);
    expect(review.evidenceChecks.map((check) => check.code)).toEqual([
      "worker-eligibility",
      "vehicle-fit",
      "aac-readiness",
      "dependency-fit",
    ]);
    expect(review.autoAssignsWorkerOrVehicle).toBe(false);
  });

  it("does not turn an empty calendar/record set into an all-clear", () => {
    const review = buildDayContinuityReview(
      buildMyDaySnapshot({ now, care: [], transport: [] }),
    );
    expect(review.readiness).toBe("not_assessed");
    expect(review.issues).toHaveLength(0);
    expect(review.suggestedHumanReview).toBe(false);
  });

  it("preserves pending and unknown statuses as review issues, not confirmations", () => {
    const review = buildDayContinuityReview(
      buildMyDaySnapshot({
        now,
        care: [{ id: "pending", status: "pending_provider", title: "Shift request" }],
        transport: [{ id: "unknown", status: "unrecognised_operator_state" }],
      }),
    );
    expect(review.issues.map((issue) => issue.sourceStatus).sort()).toEqual(["pending", "unknown"]);
    expect(review.readiness).toBe("not_assessed");
    expect(review.changesExternalRecords).toBe(false);
  });

  it("does not double-list the same issue if upstream surfaces overlap", () => {
    const snapshot = buildMyDaySnapshot({
      now,
      care: [{ id: "pending", status: "pending_provider", title: "Support" }],
      transport: [],
    });
    snapshot.continuityAlerts = [...(snapshot.continuityAlerts ?? []), snapshot.pendingActions[0]!];
    expect(buildDayContinuityReview(snapshot).issues).toHaveLength(1);
  });
});
