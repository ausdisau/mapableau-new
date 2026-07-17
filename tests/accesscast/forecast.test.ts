import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  HARBOUR_ACCESSCAST_IDS,
  accessCastFlags,
  runAccessCastForecast,
  runHarbourPlaceOutlook,
} from "@/lib/accesscast";

const FLAG_KEYS = ["MAPABLE_ACCESSCAST_ENABLED", "MAPABLE_ACCESSCAST_MODE"] as const;

beforeEach(() => {
  process.env.MAPABLE_ACCESSCAST_ENABLED = "true";
  process.env.MAPABLE_ACCESSCAST_MODE = "synthetic";
});

afterEach(() => {
  for (const k of FLAG_KEYS) delete process.env[k];
});

describe("AccessCast forecast", () => {
  it("references canonical Harbour fixture IDs", () => {
    const result = runHarbourPlaceOutlook();
    expect(result.envelope.journeyOrPlaceRef).toContain("harbour_civic");
    expect(
      result.segments.some((s) =>
        s.nodeIds.includes(HARBOUR_ACCESSCAST_IDS.entranceWest),
      ),
    ).toBe(true);
    expect(
      result.listAlternative.some((i) => i.nodeId === HARBOUR_ACCESSCAST_IDS.placeNodeId),
    ).toBe(true);
  });

  it("includes evidence envelope and limitations — not a bare label", () => {
    const result = runHarbourPlaceOutlook();
    expect(result.envelope.forecastId).toBeTruthy();
    expect(result.envelope.sourceEvidence.length).toBeGreaterThan(0);
    expect(result.envelope.limitations.length).toBeGreaterThan(0);
    expect(result.envelope.productionClaim).toBe("none");
    expect(result.envelope.synthetic).toBe(true);
    expect(result.plainLanguageSummary.length).toBeGreaterThan(20);
    expect(result.why.length).toBeGreaterThan(0);
  });

  it("starting work tomorrow is fragile or cannot_confirm", () => {
    const result = runAccessCastForecast({
      journeyRef: "journey:synthetic:taylor-harbour",
      intendedJourneyTime: "2026-07-17T08:30:00.000+10:00",
      asOf: "2026-07-16T18:00:00.000+10:00",
      scenario: "starting_work_tomorrow",
    });
    expect(["fragile", "cannot_confirm", "stale"]).toContain(
      result.envelope.conclusionState,
    );
    expect(result.segments.some((s) => s.kind === "return_journey")).toBe(true);
    expect(result.timeline.length).toBeGreaterThan(0);
  });

  it("lift outage returns temporarily_unavailable", () => {
    const result = runAccessCastForecast({
      intendedJourneyTime: "2026-07-17T08:30:00.000+10:00",
      asOf: "2026-07-16T18:00:00.000+10:00",
      scenario: "lift_outage",
    });
    expect(result.envelope.conclusionState).toBe("temporarily_unavailable");
  });

  it("conflicting venue information returns conflicting", () => {
    const result = runAccessCastForecast({
      intendedJourneyTime: "2026-07-17T08:30:00.000+10:00",
      asOf: "2026-07-16T18:00:00.000+10:00",
      scenario: "conflicting_venue",
    });
    expect(result.envelope.conclusionState).toBe("conflicting");
  });

  it("vision false positive does not mark route temporarily_unavailable", () => {
    const result = runAccessCastForecast({
      intendedJourneyTime: "2026-07-17T08:30:00.000+10:00",
      asOf: "2026-07-16T18:00:00.000+10:00",
      scenario: "vision_false_positive",
    });
    expect(result.envelope.conclusionState).not.toBe("temporarily_unavailable");
    expect(result.envelope.sourceEvidence.some((e) => e.class === "model_candidate")).toBe(
      true,
    );
  });

  it("offline expired cast is stale", () => {
    const result = runAccessCastForecast({
      intendedJourneyTime: "2026-07-17T08:30:00.000+10:00",
      asOf: "2026-07-16T18:00:00.000+10:00",
      scenario: "offline_expired",
    });
    expect(result.envelope.conclusionState).toBe("stale");
    expect(result.why.some((w) => /offline/i.test(w))).toBe(true);
  });

  it("return journey fragility keeps whole journey fragile", () => {
    const result = runAccessCastForecast({
      intendedJourneyTime: "2026-07-17T08:30:00.000+10:00",
      asOf: "2026-07-16T18:00:00.000+10:00",
      scenario: "return_journey_fragile",
    });
    expect(result.envelope.conclusionState).toBe("fragile");
    const ret = result.segments.find((s) => s.kind === "return_journey");
    expect(ret?.currentState).toBe("fragile");
  });

  it("provides a complete list alternative to any map", () => {
    const result = runHarbourPlaceOutlook();
    expect(result.listAlternative.length).toBeGreaterThan(1);
    for (const item of result.listAlternative) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.summary.length).toBeGreaterThan(0);
    }
  });

  it("defaults flags off", () => {
    delete process.env.MAPABLE_ACCESSCAST_ENABLED;
    expect(accessCastFlags.enabled).toBe(false);
  });
});
