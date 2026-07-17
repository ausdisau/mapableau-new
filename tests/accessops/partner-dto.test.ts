import { describe, expect, it } from "vitest";

import { toPartnerAssetDto } from "@/lib/accessops/partners/dto";
import type { AccessAssetDto } from "@/lib/accessops/types";

describe("Partner DTO", () => {
  it("removes ownership and restricted geometry", () => {
    const dto: AccessAssetDto = {
      id: "asset-1",
      publicIdentifier: "acc_public",
      assetType: "lift",
      title: "Lift",
      description: null,
      lifecycleStatus: "active",
      publicVisibility: "never_public",
      securityClassification: "restricted",
      geometryReference: "secret-geometry",
      geometryType: "point",
      geometryVersion: 1,
      ownerEntityId: "owner-1",
      operatorEntityId: "operator-1",
      maintainerEntityId: "maintainer-1",
      effectiveFrom: new Date("2026-01-01T00:00:00Z"),
      effectiveTo: null,
    };
    const partner = toPartnerAssetDto(dto);
    expect(partner).not.toHaveProperty("ownerEntityId");
    expect(partner.geometryReference).toBeNull();
  });
});
