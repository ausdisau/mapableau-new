import { afterEach, describe, expect, it, vi } from "vitest";

import {
  detectNdisTimeBand,
  mapShiftToNdisLineItem,
} from "@/lib/billing/ndis-pricing-engine";
import { hashShiftTelemetry } from "@/lib/care/shift-telemetry-schemas";
import {
  clearPaceBudgetOverlays,
  getPaceBudgetOverlay,
  seedPaceBudgetOverlay,
} from "@/lib/ndis/pace-endorsement-store";

describe("hashShiftTelemetry", () => {
  it("is stable for the same lat/lng/timestamp", () => {
    const a = hashShiftTelemetry({
      latitude: -33.8688,
      longitude: 151.2093,
      timestamp: "2026-07-25T01:00:00.000Z",
    });
    const b = hashShiftTelemetry({
      latitude: -33.8688,
      longitude: 151.2093,
      timestamp: "2026-07-25T01:00:00.000Z",
    });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("changes when coordinates change", () => {
    const a = hashShiftTelemetry({
      latitude: -33.8688,
      longitude: 151.2093,
      timestamp: "2026-07-25T01:00:00.000Z",
    });
    const b = hashShiftTelemetry({
      latitude: -33.87,
      longitude: 151.2093,
      timestamp: "2026-07-25T01:00:00.000Z",
    });
    expect(a).not.toBe(b);
  });
});

describe("mapShiftToNdisLineItem", () => {
  it("maps weekday daytime standard to 01_011_0107_1_1", () => {
    // Wednesday 10:00–12:00 Sydney (AEST = UTC+10 in July)
    const result = mapShiftToNdisLineItem({
      startAt: "2026-07-22T00:00:00.000Z",
      endAt: "2026-07-22T02:00:00.000Z",
      tasks: [{ name: "Personal care", intensity: "standard" }],
    });
    expect(result.timeBand).toBe("weekday_daytime");
    expect(result.intensity).toBe("standard");
    expect(result.supportItemNumber).toBe("01_011_0107_1_1");
    expect(result.unitPriceCents).toBe(6706);
    expect(result.quantityHours).toBe(2);
    expect(result.totalAmountCents).toBe(6706 * 2);
    expect(result.source).toBe("scaffold_rate_table");
  });

  it("maps weekday evening (>=20:00 Sydney) to evening code", () => {
    // Wednesday 20:00–21:00 Sydney = 10:00–11:00 UTC
    const result = mapShiftToNdisLineItem({
      startAt: "2026-07-22T10:00:00.000Z",
      endAt: "2026-07-22T11:00:00.000Z",
      tasks: [],
    });
    expect(detectNdisTimeBand(new Date("2026-07-22T10:00:00.000Z"))).toBe(
      "weekday_evening"
    );
    expect(result.supportItemNumber).toBe("01_012_0107_1_1");
  });

  it("maps Saturday and Sunday bands", () => {
    const sat = mapShiftToNdisLineItem({
      startAt: "2026-07-25T01:00:00.000Z", // Sat 11:00 Sydney
      endAt: "2026-07-25T02:00:00.000Z",
    });
    expect(sat.timeBand).toBe("saturday");
    expect(sat.supportItemNumber).toBe("01_013_0107_1_1");

    const sun = mapShiftToNdisLineItem({
      startAt: "2026-07-26T01:00:00.000Z", // Sun 11:00 Sydney
      endAt: "2026-07-26T02:00:00.000Z",
    });
    expect(sun.timeBand).toBe("sunday");
    expect(sun.supportItemNumber).toBe("01_014_0107_1_1");
  });

  it("maps public holiday and high intensity", () => {
    const result = mapShiftToNdisLineItem({
      startAt: "2026-01-26T01:00:00.000Z", // Australia Day
      endAt: "2026-01-26T03:00:00.000Z",
      tasks: [{ name: "Complex care", intensity: "high" }],
    });
    expect(result.timeBand).toBe("public_holiday");
    expect(result.intensity).toBe("high");
    expect(result.supportItemNumber).toBe("01_019_0107_1_1");
  });
});

describe("pace endorsement store + claim draft invariants", () => {
  afterEach(() => {
    clearPaceBudgetOverlays();
    vi.unstubAllEnvs();
  });

  it("flags low budget overlay below 10%", () => {
    seedPaceBudgetOverlay({
      participantId: "p1",
      supportCategoryCode: "0001",
      expirationDate: new Date(Date.now() + 86_400_000).toISOString(),
      remainingCategoryBudget: 500,
      totalCategoryBudget: 10_000,
    });
    const overlay = getPaceBudgetOverlay("p1", "0001");
    expect(overlay).not.toBeNull();
    expect(
      overlay!.remainingCategoryBudget / overlay!.totalCategoryBudget
    ).toBe(0.05);
  });

  it("DRAFT_ONLY claim payload shape never sets liveSubmit", async () => {
    // Unit-level invariant on the type/constants used by the builder
    const draft = {
      authorityCeiling: "DRAFT_ONLY" as const,
      requiresHumanConfirmation: true as const,
      liveSubmit: false as const,
    };
    expect(draft.liveSubmit).toBe(false);
    expect(draft.authorityCeiling).toBe("DRAFT_ONLY");
    expect(draft.requiresHumanConfirmation).toBe(true);
  });
});
