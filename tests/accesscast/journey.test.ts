import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  HARBOUR_ACCESSCAST_IDS,
  STARTING_WORK_TIMELINE_HINTS,
  buildAccessCastTimeline,
  formatTimelinePlainText,
  runStartingWorkJourneyAccessCast,
} from "@/lib/accesscast";

beforeEach(() => {
  process.env.MAPABLE_ACCESSCAST_ENABLED = "true";
  process.env.MAPABLE_ACCESSCAST_MODE = "synthetic";
  process.env.MAPABLE_ACCESSCAST_JOURNEY_OUTLOOK_ENABLED = "true";
});

afterEach(() => {
  delete process.env.MAPABLE_ACCESSCAST_ENABLED;
  delete process.env.MAPABLE_ACCESSCAST_MODE;
  delete process.env.MAPABLE_ACCESSCAST_JOURNEY_OUTLOOK_ENABLED;
});

describe("Starting Work journey AccessCast", () => {
  it("builds Taylor → Harbour Room 3.12 outlook with return leg", () => {
    const journey = runStartingWorkJourneyAccessCast({
      scenario: "starting_work_tomorrow",
    });

    expect(journey.participantLabel).toBe("Taylor");
    expect(journey.venueLabel).toBe("Harbour Civic Centre");
    expect(journey.destinationLabel).toBe("Room 3.12");
    expect(journey.placeRef).toBe(HARBOUR_ACCESSCAST_IDS.placeCanonicalRef);

    const kinds = journey.result.segments.map((s) => s.kind);
    expect(kinds).toContain("accessible_transport");
    expect(kinds).toContain("entrance");
    expect(kinds).toContain("internal_route");
    expect(kinds).toContain("destination_room");
    expect(kinds).toContain("return_journey");
    expect(journey.returnJourney).not.toBeNull();
  });

  it("exposes confirmation tasks that are suggested not verified", () => {
    const journey = runStartingWorkJourneyAccessCast();
    expect(journey.confirmationTasks.length).toBeGreaterThan(0);
    for (const task of journey.confirmationTasks) {
      expect(task.status).toBe("suggested");
    }
  });

  it("marks fragility when vehicle/lift unconfirmed", () => {
    const journey = runStartingWorkJourneyAccessCast({
      scenario: "starting_work_tomorrow",
    });
    expect(journey.fragility.isFragile).toBe(true);
    expect(["fragile", "cannot_confirm", "stale"]).toContain(
      journey.result.envelope.conclusionState,
    );
  });

  it("keeps whole journey fragile when only return is unconfirmed", () => {
    const journey = runStartingWorkJourneyAccessCast({
      scenario: "return_journey_fragile",
    });
    expect(journey.result.envelope.conclusionState).toBe("fragile");
    expect(journey.returnJourney?.currentState).toBe("fragile");
  });

  it("provides accessible timeline, audio and print summaries", () => {
    const journey = runStartingWorkJourneyAccessCast();
    expect(journey.result.timeline.length).toBe(STARTING_WORK_TIMELINE_HINTS.length);
    expect(journey.timelinePlainText).toMatch(/Accessible vehicle confirmation due/);
    expect(journey.audioSummary).toMatch(/not a safety guarantee/i);
    expect(journey.printSummary).toMatch(/ACCESS OUTLOOK/);
    expect(journey.printSummary).toMatch(/Timeline:/);
  });

  it("timeline builder correlates segment ids", () => {
    const items = buildAccessCastTimeline(
      "2026-07-17T08:30:00.000+10:00",
      STARTING_WORK_TIMELINE_HINTS,
    );
    expect(items.some((i) => i.relatedSegmentId === "seg-return")).toBe(true);
    expect(formatTimelinePlainText(items).length).toBeGreaterThan(40);
  });

  it("failed lift outage is temporarily_unavailable and not hidden", () => {
    const journey = runStartingWorkJourneyAccessCast({ scenario: "lift_outage" });
    expect(journey.result.envelope.conclusionState).toBe("temporarily_unavailable");
    const lift = journey.result.segments.find((s) => s.id === "seg-lift");
    expect(lift?.hardRequirementEffect).toBe("blocks");
  });
});
