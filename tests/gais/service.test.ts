import { describe, expect, it } from "vitest";

import {
  barrierVerificationToGaisEvidenceState,
  placeConfidenceToGaisEvidenceState,
  provenanceStatusToGaisEvidenceState,
} from "@/lib/gais/service/evidence-mapper";
import { accessPlaceFeatureToGaisType } from "@/lib/gais/service/feature-mapper";
import { mapableGaisFlags, gaisFeatureDisabledResponse } from "@/lib/config/mapable-gais";

describe("GAIS evidence mapper", () => {
  it("maps provenance to GAIS states", () => {
    expect(provenanceStatusToGaisEvidenceState("verified")).toBe("VERIFIED");
    expect(provenanceStatusToGaisEvidenceState("unknown")).toBe("UNKNOWN");
  });

  it("maps place confidence without defaulting to verified", () => {
    expect(placeConfidenceToGaisEvidenceState("unknown")).toBe("UNKNOWN");
    expect(placeConfidenceToGaisEvidenceState("user_reported")).toBe(
      "COMMUNITY_REPORTED",
    );
  });

  it("maps barrier verification", () => {
    expect(barrierVerificationToGaisEvidenceState("community_reported")).toBe(
      "COMMUNITY_REPORTED",
    );
  });
});

describe("GAIS feature mapper", () => {
  it("maps access place features to GAIS types", () => {
    expect(accessPlaceFeatureToGaisType("lift_access")).toBe("LIFT");
    expect(accessPlaceFeatureToGaisType("step_free_entry")).toBe("ENTRANCE");
  });
});

describe("GAIS API gates", () => {
  it("flags default off", () => {
    expect(mapableGaisFlags.enabled).toBe(false);
    expect(mapableGaisFlags.readEnabled).toBe(false);
  });

  it("returns disabled response", async () => {
    const res = gaisFeatureDisabledResponse("MAPABLE_GAIS_ENABLED");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.enabled).toBe(false);
  });
});
