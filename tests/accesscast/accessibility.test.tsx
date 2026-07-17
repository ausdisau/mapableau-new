import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ACCESS_CAST_STATE_PLAIN_LANGUAGE,
  runAccessCastForecast,
  runHarbourPlaceOutlook,
} from "@/lib/accesscast";

beforeEach(() => {
  process.env.MAPABLE_ACCESSCAST_ENABLED = "true";
  process.env.MAPABLE_ACCESSCAST_MODE = "synthetic";
});

afterEach(() => {
  delete process.env.MAPABLE_ACCESSCAST_ENABLED;
  delete process.env.MAPABLE_ACCESSCAST_MODE;
});

describe("AccessCast accessibility contracts", () => {
  it("never relies on colour alone — every state has plain language", () => {
    const result = runHarbourPlaceOutlook();
    const state = result.envelope.conclusionState;
    expect(ACCESS_CAST_STATE_PLAIN_LANGUAGE[state]).toBeTruthy();
    expect(result.plainLanguageSummary).toMatch(/State:/i);
  });

  it("exposes text-first timeline as structured list", () => {
    const result = runAccessCastForecast({
      intendedJourneyTime: "2026-07-17T08:30:00.000+10:00",
      asOf: "2026-07-16T18:00:00.000+10:00",
      scenario: "starting_work_tomorrow",
    });
    expect(result.timeline.length).toBeGreaterThan(0);
    for (const item of result.timeline) {
      expect(item.at).toBeTruthy();
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("list alternative covers segments without requiring a map", () => {
    const result = runAccessCastForecast({
      intendedJourneyTime: "2026-07-17T08:30:00.000+10:00",
      asOf: "2026-07-16T18:00:00.000+10:00",
      scenario: "starting_work_tomorrow",
    });
    expect(result.listAlternative.length).toBeGreaterThanOrEqual(result.segments.length);
  });

  it("confirmation tasks distinguish suggested from verified", () => {
    const result = runAccessCastForecast({
      intendedJourneyTime: "2026-07-17T08:30:00.000+10:00",
      asOf: "2026-07-16T18:00:00.000+10:00",
      scenario: "starting_work_tomorrow",
    });
    for (const task of result.envelope.confirmationTasks) {
      expect(task.status).toBe("suggested");
      expect(task.status).not.toBe("evidence_verified");
    }
  });
});
