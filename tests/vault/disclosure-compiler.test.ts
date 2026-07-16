import { describe, expect, it } from "vitest";

import {
  buildDisclosureDiff,
  compileDisclosureRequest,
} from "@/lib/vault/disclosure-compiler";

describe("Vault disclosure compiler", () => {
  it("permits transport fields and denies diagnosis and full passport", () => {
    const result = compileDisclosureRequest({
      purposeCode: "transport.driver_handover",
      requestedFields: [
        "pickup_point",
        "destination",
        "mobility.equipment_dimensions",
        "ramp_orientation",
        "companion_count",
        "diagnosis",
        "access_passport.full",
      ],
    });

    expect(result.permittedFields).toEqual(
      expect.arrayContaining([
        "pickup_point",
        "destination",
        "mobility.equipment_dimensions",
        "ramp_orientation",
        "companion_count",
      ])
    );
    expect(result.deniedFields).toEqual(
      expect.arrayContaining(["diagnosis", "access_passport.full"])
    );
    expect(result.participantReviewRequired).toBe(true);
  });

  it("denies employer diagnosis and care history by default", () => {
    const result = compileDisclosureRequest({
      purposeCode: "jobs.employer_adjustment",
      requestedFields: [
        "functional_adjustments",
        "diagnosis",
        "care_history.full",
      ],
    });
    expect(result.permittedFields).toContain("functional_adjustments");
    expect(result.deniedFields).toEqual(
      expect.arrayContaining(["diagnosis", "care_history.full"])
    );
  });

  it("builds a text disclosure diff", () => {
    const diff = buildDisclosureDiff({
      previousFields: ["pickup_point", "companion_count"],
      nextPermitted: ["pickup_point", "destination", "companion_count"],
      nextDenied: ["diagnosis"],
    });
    expect(diff.added).toEqual(["destination"]);
    expect(diff.removed).toEqual([]);
    expect(diff.denied).toContain("diagnosis");
    expect(diff.accessibilityNote).toMatch(/colour alone/i);
  });
});
