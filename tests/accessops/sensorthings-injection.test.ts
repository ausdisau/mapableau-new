import { describe, expect, it } from "vitest";

import { validateSensorThingsQuery } from "@/lib/accessops/protocols/sensorthings/validator";

describe("SensorThings injection guard", () => {
  it("rejects tasking and injection-like query text", () => {
    const result = validateSensorThingsQuery("Observations?$filter=id eq 1; DROP TABLE Tasking");
    expect(result.conformant).toBe(false);
    expect(result.errors).toContain("tasking_profile_disabled");
    expect(result.errors).toContain("query_injection_pattern");
  });
});
