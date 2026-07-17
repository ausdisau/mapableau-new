import { describe, expect, it } from "vitest";

import { decideCanonicalRoute } from "@/lib/vault/router";

describe("Vault canonical router", () => {
  it("routes accessibility_profile as reference_only", () => {
    const decision = decideCanonicalRoute({
      itemType: "accessibility_profile",
      canonicalRecordId: "profile_1",
    });
    expect(decision.canonicalDomain).toBe("accessibility_profile");
    expect(decision.vaultTreatment).toBe("reference_only");
    expect(decision.humanReviewRequired).toBe(false);
    expect(decision.fieldManifest).toContain("communicationPreferences");
  });

  it("routes access_passport without duplicating as editable vault copy", () => {
    const decision = decideCanonicalRoute({ itemType: "access_passport" });
    expect(decision.canonicalDomain).toBe("access_passport");
    expect(decision.vaultTreatment).toBe("reference_only");
  });

  it("routes aura_memory_card to aura_memory domain", () => {
    const decision = decideCanonicalRoute({ itemType: "aura_memory_card" });
    expect(decision.canonicalDomain).toBe("aura_memory");
    expect(decision.vaultTreatment).toBe("reference_only");
  });

  it("rejects unknown item types with human review", () => {
    const decision = decideCanonicalRoute({ itemType: "mystery_blob" });
    expect(decision.canonicalDomain).toBe("unknown");
    expect(decision.vaultTreatment).toBe("not_permitted");
    expect(decision.humanReviewRequired).toBe(true);
  });

  it("rejects suggested domain overrides", () => {
    const decision = decideCanonicalRoute({
      itemType: "accessibility_profile",
      suggestedDomain: "vault_native",
    });
    expect(decision.vaultTreatment).toBe("not_permitted");
    expect(decision.canonicalDomain).toBe("accessibility_profile");
    expect(decision.humanReviewRequired).toBe(true);
  });
});
