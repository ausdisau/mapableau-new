import { afterEach, describe, expect, it } from "vitest";

import {
  __resetProjectSidewalkImportCacheForTests,
  importProjectSidewalkLabel,
} from "@/lib/integrations/access/project-sidewalk";
import { overtureBaseGeographyProvider } from "@/lib/integrations/access/overture";
import { buildPlaceEvidenceSlice } from "@/lib/access/community-graph";
import {
  listAccessQuestsService,
  submitAccessObservationService,
} from "@/lib/access/services";
import { __resetQuestIdempotencyForTests } from "@/lib/access/quests/submit";
import { assertExternalPublicationAllowed } from "@/lib/integrations/access/contracts";

describe("NOW foundations", () => {
  afterEach(() => {
    delete process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED;
    delete process.env.MAPABLE_PROJECT_SIDEWALK_ENABLED;
    delete process.env.MAPABLE_ACCESS_QUESTS_ENABLED;
    delete process.env.MAPABLE_OVERTURE_BASE_GEOGRAPHY_ENABLED;
    __resetProjectSidewalkImportCacheForTests();
    __resetQuestIdempotencyForTests();
  });

  it("idempotently imports Project Sidewalk labels", () => {
    const payload = {
      label_id: 42,
      label_type: "CurbRamp",
      lat: -33.8,
      lng: 151.0,
      severity: 3,
    };
    const first = importProjectSidewalkLabel(payload);
    const second = importProjectSidewalkLabel(payload);
    expect(first.status).toBe("imported");
    expect(second.status).toBe("duplicate");
    expect(first.sourceKey).toBe(second.sourceKey);
    if (first.status === "imported") {
      expect(first.observation.claimStrength).toBe("observation");
      expect(first.observation.provenance.verificationState).toBe("UNVERIFIED");
    }
  });

  it("serves Overture fixtures only when flag on", async () => {
    await expect(
      overtureBaseGeographyProvider.getFeatures({ theme: "places", limit: 10 }),
    ).rejects.toThrow(/disabled/i);

    process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED = "true";
    process.env.MAPABLE_OVERTURE_BASE_GEOGRAPHY_ENABLED = "true";
    const features = await overtureBaseGeographyProvider.getFeatures({
      theme: "places",
      limit: 10,
    });
    expect(features.length).toBeGreaterThan(0);
    expect(features[0]?.sourceProvider).toBe("overture");
    expect(features[0]?.externalId).toContain("overture:");
  });

  it("builds community graph place↔observation edges", () => {
    const slice = buildPlaceEvidenceSlice({
      placeId: "place-1",
      observationId: "obs-1",
      capabilityId: "cap-1",
    });
    expect(slice.nodes.map((n) => n.kind)).toContain("capability");
    expect(slice.edges.some((e) => e.kind === "supported_by_observation")).toBe(
      true,
    );
  });

  it("exposes tool-safe quest services behind flags", () => {
    expect(() =>
      listAccessQuestsService({
        actorRef: "a1",
        permissionScope: "contributor",
      }),
    ).toThrow(/disabled/i);

    process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED = "true";
    process.env.MAPABLE_ACCESS_QUESTS_ENABLED = "true";
    const quests = listAccessQuestsService({
      actorRef: "a1",
      permissionScope: "contributor",
    });
    expect(quests.length).toBeGreaterThan(5);

    const obs = submitAccessObservationService(
      { actorRef: "a1", permissionScope: "contributor" },
      {
        questId: "entrance.step_free",
        value: "unknown",
        lat: -33.87,
        lng: 151.21,
        idempotencyKey: "tool-safe-idem-1",
        actorRef: "a1",
      },
    );
    expect(obs.value).toBe("UNKNOWN");
  });

  it("denies external publication by default", () => {
    expect(() =>
      assertExternalPublicationAllowed("PRIVATE_EVIDENCE"),
    ).toThrow(/denied/i);
  });
});
