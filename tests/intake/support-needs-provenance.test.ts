import { describe, expect, it } from "vitest";

import { classifySupportNeedsPayload } from "@/lib/intake/support-needs-provenance";

describe("support needs record provenance", () => {
  it("preserves modern self reports without claiming formal scores", () => {
    expect(classifySupportNeedsPayload({
      recordType: "participant_authored_support_snapshot",
      schemaVersion: 1, areas: [{ domainId: "mobility", participantDescription: "some" }],
      unselectedAreasMean: "not_assessed", officialAssessment: false,
    })).toBe("participant_self_report_v1");
  });
  it("distinguishes old lite and full instrument-shaped payloads", () => {
    expect(classifySupportNeedsPayload({ source: "registration_assessor", domains: {} }))
      .toBe("legacy_registration_payload");
    expect(classifySupportNeedsPayload({ domains: { mobility: {} } }))
      .toBe("legacy_ican_draft");
  });
  it("does not reinterpret incomplete or future records", () => {
    expect(classifySupportNeedsPayload({ recordType: "participant_authored_support_snapshot", schemaVersion: 2, areas: [], unselectedAreasMean: "not_assessed" }))
      .toBe("unsupported");
    expect(classifySupportNeedsPayload({ skipped: true })).toBe("unsupported");
  });
});
