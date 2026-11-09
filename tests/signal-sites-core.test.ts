import { describe, expect, it } from "vitest";

import {
  aggregateJourney,
  countRatings,
  csvCell,
  evidenceRating,
  hasEvidence,
  stripPrivate,
} from "@/lib/signal-sites/core";

const reviewed = {
  finding: "Direct measurement of the trial ramp was recorded.",
  method: "direct observation",
  observedAt: "2026-11-09",
  measurement: "gradient 1:20",
  evidenceState: "reviewed",
  moderation: "accepted",
  proposed: "green",
};

describe("signal-sites core RAG rules", () => {
  it("rates reviewed green evidence", () => {
    expect(evidenceRating(reviewed)).toBe("green");
  });

  it("keeps unreviewed, outdated, disputed and assumptions as unknown", () => {
    expect(evidenceRating({ ...reviewed, evidenceState: "reported" })).toBe(
      "unknown",
    );
    expect(evidenceRating({ ...reviewed, evidenceState: "outdated" })).toBe(
      "unknown",
    );
    expect(evidenceRating({ ...reviewed, evidenceState: "disputed" })).toBe(
      "unknown",
    );
    expect(evidenceRating({ ...reviewed, claimBasis: "assumption" })).toBe(
      "unknown",
    );
    expect(evidenceRating({ ...reviewed, notApplicable: true })).toBe(
      "unknown",
    );
  });

  it("requires minimum evidence before accepting a colour", () => {
    expect(hasEvidence({ ...reviewed, measurement: "", finding: "Short" })).toBe(
      false,
    );
    expect(evidenceRating({ ...reviewed, measurement: "", finding: "Short" })).toBe(
      "unknown",
    );
  });

  it("aggregates journeys conservatively", () => {
    expect(
      aggregateJourney([{ ...reviewed, evidenceState: "reported" }]).rating,
    ).toBe("unknown");
    expect(aggregateJourney([{ ...reviewed, proposed: "red" }]).rating).toBe(
      "unknown",
    );
    expect(
      aggregateJourney([{ ...reviewed, proposed: "red" }], {
        noVerifiedAlternative: true,
      }).rating,
    ).toBe("red");
    expect(
      aggregateJourney([{ ...reviewed, proposed: "red" }], {
        verifiedAlternative: true,
      }).rating,
    ).toBe("amber");
    expect(aggregateJourney([reviewed, reviewed]).rating).toBe("green");
    expect(aggregateJourney([]).rating).toBe("unknown");
  });

  it("counts not-applicable separately and strips private fields", () => {
    expect(countRatings([{ ...reviewed, notApplicable: true }]).notApplicable).toBe(
      1,
    );
    expect(
      stripPrivate({
        ...reviewed,
        latitude: -33.8,
        participantName: "a",
        evidenceIds: ["x"],
      }).latitude,
    ).toBeUndefined();
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
  });
});
