import { describe, expect, it } from "vitest";

import {
  isVerifiedProvenance,
  provenanceDisclaimer,
  provenanceStrength,
} from "@/lib/access-vault/provenance";

describe("provenance strength", () => {
  it("self_asserted is the weakest", () => {
    expect(provenanceStrength("self_asserted")).toBe(1);
  });

  it("externally_verified is the strongest", () => {
    expect(provenanceStrength("externally_verified")).toBe(5);
  });

  it("orders provider < third_party < externally_verified", () => {
    expect(provenanceStrength("provider_asserted")).toBeLessThan(
      provenanceStrength("third_party_asserted")
    );
    expect(provenanceStrength("third_party_asserted")).toBeLessThan(
      provenanceStrength("externally_verified")
    );
  });
});

describe("verified provenance predicate", () => {
  it("self_asserted is not verified", () => {
    expect(isVerifiedProvenance("self_asserted")).toBe(false);
  });

  it("externally_verified is verified", () => {
    expect(isVerifiedProvenance("externally_verified")).toBe(true);
  });

  it("provider_asserted is not verified (scoped to that provider)", () => {
    expect(isVerifiedProvenance("provider_asserted")).toBe(false);
  });
});

describe("provenance disclaimers", () => {
  it("self_asserted mentions lived-experience", () => {
    expect(provenanceDisclaimer("self_asserted", "communication_preference"))
      .toContain("lived-experience");
  });

  it("accessibility_preference category adds functional-need language", () => {
    expect(
      provenanceDisclaimer("platform_asserted", "accessibility_preference")
    ).toContain("functional need");
  });

  it("accessibility_preference disclaimer refuses clinical diagnosis framing", () => {
    expect(
      provenanceDisclaimer("platform_asserted", "accessibility_preference")
    ).toContain("not clinical diagnosis");
  });
});
