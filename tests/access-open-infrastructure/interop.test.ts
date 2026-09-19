import { describe, expect, it } from "vitest";

import {
  projectObservationToPublicFeature,
  stripIdentityFields,
} from "@/lib/access/interop/project";
import { createUnverifiedProvenance, normalizedObservationSchema } from "@/lib/integrations/access/contracts";

describe("interop strips identity", () => {
  it("removes actor fields from public projection", () => {
    const stripped = stripIdentityFields({
      featureType: "entrance",
      actorRef: "secret",
      userId: "u1",
      participantId: "p1",
    });
    expect(stripped).not.toHaveProperty("actorRef");
    expect(stripped).not.toHaveProperty("userId");
    expect(stripped).not.toHaveProperty("participantId");
  });

  it("public feature has no identity fields", () => {
    const obs = normalizedObservationSchema.parse({
      featureType: "entrance",
      attribute: "step_free",
      value: "UNKNOWN",
      valueQualifier: "UNKNOWN",
      provenance: createUnverifiedProvenance({
        sourceProvider: "mapable_quests",
      }),
      claimStrength: "observation",
    });
    const feature = projectObservationToPublicFeature(obs, "f-1");
    expect(feature).not.toHaveProperty("actorRef");
    expect(feature.sourceProvider).toBe("mapable_quests");
  });
});
