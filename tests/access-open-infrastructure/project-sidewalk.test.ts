import { describe, expect, it } from "vitest";

import { mapProjectSidewalkLabel } from "@/lib/integrations/access/project-sidewalk/mapper";

describe("project sidewalk normalize", () => {
  it("preserves unverified provenance", () => {
    const obs = mapProjectSidewalkLabel({
      label_id: 42,
      label_type: "CurbRamp",
      lat: -33.87,
      lng: 151.21,
      severity: 1,
      time_created: "2026-01-01T00:00:00Z",
    });
    expect(obs.provenance.verificationState).toBe("UNVERIFIED");
    expect(obs.claimStrength).toBe("observation");
    expect(obs.notes).toMatch(/not MapAble verification/i);
  });
});
