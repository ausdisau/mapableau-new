import { describe, expect, it } from "vitest";

import { buildNutritionLabel } from "@/lib/vault/nutrition-label";

describe("Vault nutrition label", () => {
  it("explains reference-only storage and canonical deletion boundary", () => {
    const label = buildNutritionLabel({
      id: "item_1",
      displayName: "Accessibility profile",
      itemType: "accessibility_profile",
      canonicalDomain: "accessibility_profile",
      canonicalRecordId: "ap_1",
      vaultTreatment: "reference_only",
      classification: "personal",
      fieldManifestJson: ["communicationPreferences", "mobilityNeeds"],
      purpose: "Stable presentation preferences",
      encryptionState: "none_reference_only",
      exportState: "exportable",
      deletionState: "canonical_boundary",
      retentionReason: "Participant-visible index",
      expiresAt: null,
      updatedAt: new Date("2026-07-16T00:00:00.000Z"),
      vault: { ownerUserId: "user_1" },
    });

    expect(label.canonicalSource).toMatch(/AccessibilityProfile/);
    expect(label.storageLocation).toMatch(/Reference only/i);
    expect(label.fields).toContain("communicationPreferences");
    expect(label.deletionOptions.join(" ")).toMatch(/does not delete canonical/i);
    expect(label.limitations.join(" ")).toMatch(/reference/i);
    expect(label.auditLink).toContain("item_1");
  });
});
