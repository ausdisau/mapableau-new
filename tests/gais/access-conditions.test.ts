import { describe, expect, it } from "vitest";

import {
  accessConditionDisplayLabel,
  buildActiveAtPrismaFilter,
  isEventActiveAt,
  mapTemporaryBarrierToAccessCondition,
  parseActiveAt,
} from "@/lib/gais/conditions";
import { summarizeGoAccessConditions } from "@/lib/gais/conditions/go-consumer";
import type { AccessTemporaryBarrier } from "@prisma/client";

function makeBarrier(
  overrides: Partial<AccessTemporaryBarrier> = {},
): AccessTemporaryBarrier {
  return {
    id: "barrier-1",
    segmentExternalId: "seg-1",
    graphId: "sandbox-sydney-cbd-pilot",
    type: "blocked_path",
    reportedAt: new Date("2026-08-20T10:00:00Z"),
    expiresAt: new Date("2026-08-25T10:00:00Z"),
    source: "community",
    confidence: 0.5,
    verificationState: "community_reported",
    description: "Path blocked",
    reporterUserId: "user-secret",
    latitude: -33.87,
    longitude: 151.21,
    createdAt: new Date("2026-08-20T10:00:00Z"),
    updatedAt: new Date("2026-08-20T10:00:00Z"),
    ...overrides,
  };
}

describe("temporal activation", () => {
  it("activates event within reported and expiry window", () => {
    const activeAt = new Date("2026-08-22T12:00:00Z");
    expect(
      isEventActiveAt(
        {
          reportedAt: "2026-08-20T10:00:00Z",
          expiresAt: "2026-08-25T10:00:00Z",
        },
        activeAt,
      ),
    ).toBe(true);
  });

  it("excludes expired events", () => {
    const activeAt = new Date("2026-08-26T12:00:00Z");
    expect(
      isEventActiveAt(
        {
          reportedAt: "2026-08-20T10:00:00Z",
          expiresAt: "2026-08-25T10:00:00Z",
        },
        activeAt,
      ),
    ).toBe(false);
  });

  it("excludes future-reported events", () => {
    const activeAt = new Date("2026-08-19T12:00:00Z");
    expect(
      isEventActiveAt(
        {
          reportedAt: "2026-08-20T10:00:00Z",
          expiresAt: "2026-08-25T10:00:00Z",
        },
        activeAt,
      ),
    ).toBe(false);
  });

  it("buildActiveAtPrismaFilter matches activation semantics", () => {
    const activeAt = new Date("2026-08-22T12:00:00Z");
    const filter = buildActiveAtPrismaFilter(activeAt);
    expect(filter.reportedAt).toEqual({ lte: activeAt });
    expect(filter.OR).toEqual([{ expiresAt: null }, { expiresAt: { gt: activeAt } }]);
  });

  it("defaults activeAt to now", () => {
    const before = Date.now();
    const activeAt = parseActiveAt();
    const after = Date.now();
    expect(activeAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(activeAt.getTime()).toBeLessThanOrEqual(after);
  });
});

describe("mapTemporaryBarrierToAccessCondition", () => {
  it("maps blocked path with segment to PATH_CLOSURE", () => {
    const event = mapTemporaryBarrierToAccessCondition(makeBarrier());
    expect(event?.eventType).toBe("PATH_CLOSURE");
  });

  it("maps lift outage type", () => {
    const event = mapTemporaryBarrierToAccessCondition(
      makeBarrier({ type: "lift_outage", segmentExternalId: "" }),
    );
    expect(event?.eventType).toBe("LIFT_OUTAGE");
  });

  it("uses factual public labels — not route unsafe", () => {
    const event = mapTemporaryBarrierToAccessCondition(makeBarrier());
    expect(event?.label).toContain("Community-reported");
    expect(event?.label.toLowerCase()).not.toContain("unsafe");
    expect(event?.label.toLowerCase()).not.toContain("safe");
  });

  it("strips reporter identity from public event shape", () => {
    const event = mapTemporaryBarrierToAccessCondition(makeBarrier());
    expect(event).not.toHaveProperty("reporterUserId");
    expect(JSON.stringify(event)).not.toContain("user-secret");
  });

  it("returns null without geometry", () => {
    const event = mapTemporaryBarrierToAccessCondition(
      makeBarrier({ latitude: null, longitude: null }),
    );
    expect(event).toBeNull();
  });
});

describe("accessConditionDisplayLabel provenance", () => {
  it("community reported obstruction label", () => {
    expect(
      accessConditionDisplayLabel({
        eventType: "OBSTRUCTION",
        verificationState: "community_reported",
        evidence: [{ sourceType: "COMMUNITY_REPORTED" }],
      }),
    ).toBe("Community-reported temporary obstruction");
  });

  it("lift outage label", () => {
    expect(
      accessConditionDisplayLabel({
        eventType: "LIFT_OUTAGE",
        verificationState: "community_reported",
        evidence: [{ sourceType: "COMMUNITY_REPORTED" }],
      }),
    ).toBe("Community-reported lift outage");
  });

  it("unknown verification label", () => {
    expect(
      accessConditionDisplayLabel({
        eventType: "OTHER",
        verificationState: "unknown",
        evidence: [{ sourceType: "UNKNOWN" }],
      }),
    ).toBe("Current status unknown");
  });
});

describe("Go access conditions consumer", () => {
  it("summarizes without safety boundary language", () => {
    const summary = summarizeGoAccessConditions([
      {
        id: "e1",
        eventType: "LIFT_OUTAGE",
        label: "Lift outage reported",
        reportedAt: "2026-08-22T10:00:00Z",
        evidence: [{ sourceType: "COMMUNITY_REPORTED" }],
        verificationState: "community_reported",
        source: "temporary_barrier",
      },
    ]);

    expect(summary.count).toBe(1);
    expect(summary.hasLiftOutage).toBe(true);
    expect(JSON.stringify(summary)).not.toMatch(/unsafe|safe/i);
  });
});

describe("map/list event type vocabulary", () => {
  it("supports evidence-backed event types only", () => {
    const types = [
      "OBSTRUCTION",
      "LIFT_OUTAGE",
      "PATH_CLOSURE",
      "CONSTRUCTION",
      "SURFACE_ISSUE",
      "OTHER",
    ] as const;
    expect(types).toHaveLength(6);
    expect(types).not.toContain("FORECAST");
  });
});
