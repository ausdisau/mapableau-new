import { describe, expect, it } from "vitest";

import { getTaxonomyEntry, VAULT_TAXONOMY } from "@/lib/vault/taxonomy";

describe("Vault taxonomy", () => {
  it("keeps vault-native items narrow", () => {
    const native = Object.values(VAULT_TAXONOMY).filter(
      (e) => e.canonicalDomain === "vault_native"
    );
    const types = native.map((e) => e.itemType);
    expect(types).toEqual(
      expect.arrayContaining([
        "trusted_contact",
        "emergency_subset",
        "recovery_configuration",
        "portable_export_package",
      ])
    );
    expect(types).not.toContain("accessibility_profile");
    expect(types).not.toContain("access_passport");
    expect(types).not.toContain("aura_memory_card");
  });

  it("marks consent as metadata_only", () => {
    const entry = getTaxonomyEntry("consent_record");
    expect(entry?.defaultTreatment).toBe("metadata_only");
  });
});
