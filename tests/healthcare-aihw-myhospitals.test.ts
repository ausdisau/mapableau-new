import { describe, expect, it } from "vitest";
import { matchAihwHospital } from "@/lib/healthcare/aihw/match";
import type { AihwReportingUnit } from "@/lib/healthcare/aihw/contracts";

const hospital = (name: string, alternatives: string[] = []): AihwReportingUnit => ({
  alternative_names: alternatives,
  closed: false,
  private: false,
  latitude: -33.8,
  longitude: 151.2,
  mapped_reporting_units: [],
  meta_tags: [],
  reporting_unit_code: "H1",
  reporting_unit_name: name,
  reporting_unit_type: { reporting_unit_type_code: "H", reporting_unit_type_name: "Hospital" },
});

describe("matchAihwHospital", () => {
  it("matches canonical hospital names", () => {
    const result = matchAihwHospital("Royal North Shore Hospital", [hospital("Royal North Shore Hospital")]);
    expect(result.status).toBe("MATCHED");
  });

  it("does not invent a link from unrelated names", () => {
    const result = matchAihwHospital("Hornsby Ku-ring-gai Hospital", [hospital("Royal North Shore Hospital")]);
    expect(result.status).toBe("NO_MATCH");
  });
});
