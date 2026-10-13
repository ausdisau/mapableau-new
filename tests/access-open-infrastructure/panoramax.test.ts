import { describe, expect, it } from "vitest";

import { assertExternalPublicationAllowed } from "@/lib/integrations/access/contracts";
import { mapPanoramaxItemToObservation } from "@/lib/integrations/access/panoramax/mapper";

describe("panoramax mapper", () => {
  it("maps item to unverified observation", () => {
    const obs = mapPanoramaxItemToObservation({
      id: "item-1",
      type: "Feature",
      properties: { datetime: "2026-01-01T00:00:00Z" },
      geometry: { type: "Point", coordinates: [151.21, -33.87] },
    });
    expect(obs.provenance.verificationState).toBe("UNVERIFIED");
    expect(obs.claimStrength).toBe("observation");
  });

  it("denies external publication for private evidence", () => {
    expect(() =>
      assertExternalPublicationAllowed("PRIVATE_EVIDENCE"),
    ).toThrow(/External publication denied/);
  });
});
