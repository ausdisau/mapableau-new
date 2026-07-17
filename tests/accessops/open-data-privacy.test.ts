import { describe, expect, it } from "vitest";

import { filterOpenDataRecord } from "@/lib/accessops/open-data/privacy-filter";

describe("AccessOps open-data privacy", () => {
  it("removes participant records and restricted records", () => {
    expect(filterOpenDataRecord({ participantId: "p1", title: "Route" })).toBeNull();
    expect(
      filterOpenDataRecord({
        securityClassification: "restricted",
        geometry: { type: "Point" },
      }),
    ).toBeNull();
  });
});
