import { describe, expect, it } from "vitest";

import { planFieldMinimisation } from "@/lib/access-vault/disclosures";
import { applyRedaction } from "@/lib/data-federation/redaction";
import { relabelKeys } from "@/lib/data-federation/transform";

describe("planFieldMinimisation", () => {
  it("always allows accessibility preferences", () => {
    const result = planFieldMinimisation(
      ["accessibilityPreferences", "email"],
      "minimum_necessary"
    );
    expect(result.allowed).toContain("accessibilityPreferences");
    expect(result.redacted).toContain("email");
  });

  it("redacts everything except always-allow list under strict", () => {
    const result = planFieldMinimisation(
      ["accessibilityPreferences", "phone", "notes"],
      "strict"
    );
    expect(result.allowed).toEqual(["accessibilityPreferences"]);
    expect(result.redacted).toEqual(expect.arrayContaining(["phone", "notes"]));
  });

  it("open policy passes everything through", () => {
    const result = planFieldMinimisation(
      ["email", "phone", "ndisNumber"],
      "open"
    );
    expect(result.redacted).toEqual([]);
  });

  it("redacts ndisNumber by default", () => {
    const result = planFieldMinimisation(["ndisNumber"], "minimum_necessary");
    expect(result.redacted).toContain("ndisNumber");
  });

  it("redacts governmentIdentifier by default", () => {
    const result = planFieldMinimisation(
      ["governmentIdentifier"],
      "minimum_necessary"
    );
    expect(result.redacted).toContain("governmentIdentifier");
  });
});

describe("applyRedaction (deny-always list)", () => {
  it("always redacts recoverySeed", () => {
    const result = applyRedaction({ recoverySeed: "abc" }, "open");
    expect(result.redactedKeys).toContain("recoverySeed");
    expect(result.outbound.recoverySeed).toBeUndefined();
  });

  it("always redacts privateKey and keyMaterial", () => {
    const result = applyRedaction(
      { privateKey: "x", keyMaterial: "y", displayName: "Alice" },
      "open"
    );
    expect(result.redactedKeys).toEqual(
      expect.arrayContaining(["privateKey", "keyMaterial"])
    );
    expect(result.outbound.displayName).toBe("Alice");
  });

  it("redacts ndisNumber even under open policy", () => {
    const result = applyRedaction({ ndisNumber: "43012345" }, "open");
    expect(result.redactedKeys).toContain("ndisNumber");
  });

  it("strict policy also redacts conditional fields", () => {
    const result = applyRedaction(
      { email: "a@b.com", medicalDetails: "…" },
      "strict"
    );
    expect(result.redactedKeys).toEqual(
      expect.arrayContaining(["email", "medicalDetails"])
    );
  });
});

describe("relabelKeys", () => {
  it("relabels internal keys to portable snake_case", () => {
    const out = relabelKeys({
      accessibilityPreferences: [1],
      communicationPreference: "written",
      unrelated: 42,
    });
    expect(out.accessibility_preferences).toEqual([1]);
    expect(out.communication_preference).toBe("written");
    expect(out.unrelated).toBe(42);
  });
});
