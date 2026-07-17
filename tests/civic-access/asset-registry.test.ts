import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCivicAssetVersion,
  getCivicAsset,
  linkCivicAssetToSource,
  linkCivicExternalReference,
  listCivicAssets,
  registerCivicAsset,
  serializeCivicAsset,
} from "@/lib/civic-access/assets/asset-registry-service";
import { resetCivicMemoryStore } from "@/lib/civic-access/memory-store";
import {
  attachCivicSourceLicence,
  registerCivicSource,
} from "@/lib/civic-access/sources/source-registry-service";

describe("civic asset registry", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MAPABLE_CIVIC_ENABLED", "true");
    vi.stubEnv("MAPABLE_CIVIC_ASSET_REGISTRY_ENABLED", "true");
    vi.stubEnv("MAPABLE_CIVIC_USE_MEMORY", "true");
    resetCivicMemoryStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetCivicMemoryStore();
  });

  it("registers assets with unique stable keys per organisation", async () => {
    const asset = await registerCivicAsset({
      stableKey: "demo.library",
      organisationId: "org_a",
      accessPlaceId: "place_1",
      assetClass: "buildings_services",
      assetType: "library",
      title: "Demo Library",
      accessibilityClaims: [
        {
          claimKey: "step_free_entry",
          label: "Step-free entry",
          state: "unknown",
        },
      ],
    });
    expect(asset.accessPlaceId).toBe("place_1");
    await createCivicAssetVersion(asset.id, { versionLabel: "v1" });
    await linkCivicExternalReference(asset.id, {
      system: "access_place",
      externalId: "place_1",
    });

    const listed = await listCivicAssets("org_a");
    expect(listed).toHaveLength(1);
    expect(serializeCivicAsset(listed[0]!).externalReferences).toHaveLength(1);

    await expect(
      registerCivicAsset({
        stableKey: "demo.library",
        organisationId: "org_a",
        assetClass: "buildings_services",
        assetType: "library",
        title: "Duplicate",
      })
    ).rejects.toThrow("ASSET_STABLE_KEY_CONFLICT");
  });

  it("rejects universal score metadata", async () => {
    await expect(
      registerCivicAsset({
        stableKey: "scored",
        assetClass: "transport",
        assetType: "stop",
        title: "Stop",
        metadata: { universalScore: 99 },
      })
    ).rejects.toThrow("CIVIC_INVARIANT_VIOLATION:universalScore");
  });

  it("rejects paid confidence boosts", async () => {
    await expect(
      registerCivicAsset({
        stableKey: "paid",
        assetClass: "transport",
        assetType: "stop",
        title: "Stop",
        metadata: { paidConfidenceBoost: true },
      })
    ).rejects.toThrow("CIVIC_INVARIANT_VIOLATION:paid_confidence_boost");
  });

  it("requires a licence before linking an asset to a source", async () => {
    const source = await registerCivicSource({
      stableKey: "src.unlicensed",
      name: "Unlicensed",
      kind: "other",
    });
    const asset = await registerCivicAsset({
      stableKey: "needs.licence",
      assetClass: "transport",
      assetType: "stop",
      title: "Stop",
    });
    await expect(linkCivicAssetToSource(asset.id, source.id)).rejects.toThrow(
      "LICENCE_REQUIRED"
    );

    await attachCivicSourceLicence(source.id, {
      licenceKind: "cc_by",
      licenceName: "CC BY 4.0",
      allowsPublicPublication: true,
      allowsCommercialReuse: true,
    });
    await linkCivicAssetToSource(asset.id, source.id);
    const linked = await getCivicAsset(asset.id);
    expect(linked.sourceId).toBe(source.id);
  });

  it("isolates organisation listings", async () => {
    await registerCivicAsset({
      stableKey: "a",
      organisationId: "org_1",
      assetClass: "transport",
      assetType: "stop",
      title: "Org 1",
    });
    await registerCivicAsset({
      stableKey: "a",
      organisationId: "org_2",
      assetClass: "transport",
      assetType: "stop",
      title: "Org 2",
    });
    expect(await listCivicAssets("org_1")).toHaveLength(1);
    expect(await listCivicAssets("org_2")).toHaveLength(1);
    expect((await listCivicAssets("org_1"))[0]!.title).toBe("Org 1");
  });
});
