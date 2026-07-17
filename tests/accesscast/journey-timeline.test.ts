import { describe, expect, it } from "vitest";

import { ACCESSCAST_EVENTS, forecastStartingWorkJourney } from "@/lib/accesscast";

describe("Starting Work AccessCast timeline", () => {
  it("exposes an authoritative structured timeline including return confirmation", () => {
    const result = forecastStartingWorkJourney({ scenarioId: "starting_work_tomorrow" });
    const kinds = result.timeline.map((t) => t.kind);
    expect(kinds).toContain("confirmation_due");
    expect(kinds).toContain("journey_start");
    expect(kinds).toContain("return_confirmation");
    expect(result.segments.some((s) => s.kind === "return_journey" && s.singlePointOfFailure)).toBe(
      true,
    );
    expect(ACCESSCAST_EVENTS).toContain("accesscast.confirmation_requested");
  });
});
