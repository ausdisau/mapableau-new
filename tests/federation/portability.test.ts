import { describe, expect, it } from "vitest";

import { validatePortableBundle } from "@/lib/portability/validation";
import { detectImportConflicts } from "@/lib/portability/conflicts";

const baseBundle = {
  bundleVersion: "1.0.0",
  subjectPairwiseId: "opaque-abc",
  functionalNeeds: ["step-free"],
  communicationPreferences: ["written"],
  environmentalNeeds: ["quiet-room"],
  disclaimer: "MapAble credentials are not government credentials.",
  receipts: [],
};

describe("portable bundle validation", () => {
  it("accepts a minimal bundle", () => {
    const bundle = validatePortableBundle(baseBundle);
    expect(bundle.subjectPairwiseId).toBe("opaque-abc");
  });

  it("rejects missing bundleVersion", () => {
    expect(() =>
      validatePortableBundle({ ...baseBundle, bundleVersion: undefined })
    ).toThrow();
  });

  it("rejects negative provider count", () => {
    expect(() =>
      validatePortableBundle({
        ...baseBundle,
        serviceHistorySummary: { providerCount: -1 },
      })
    ).toThrow();
  });
});

describe("import conflict detection", () => {
  it("returns no conflicts when no existing bundle", () => {
    const conflicts = detectImportConflicts({
      incoming: validatePortableBundle(baseBundle),
      existing: null,
    });
    expect(conflicts).toEqual([]);
  });

  it("flags additions in incoming as 'new_in_incoming'", () => {
    const existing = validatePortableBundle(baseBundle);
    const incoming = validatePortableBundle({
      ...baseBundle,
      functionalNeeds: ["step-free", "quiet-corner"],
    });
    const conflicts = detectImportConflicts({ incoming, existing });
    expect(conflicts.some((c) => c.reason === "new_in_incoming")).toBe(true);
  });

  it("flags removals in incoming as 'not_present_in_incoming'", () => {
    const existing = validatePortableBundle({
      ...baseBundle,
      environmentalNeeds: ["quiet-room", "warm-lighting"],
    });
    const incoming = validatePortableBundle({
      ...baseBundle,
      environmentalNeeds: ["quiet-room"],
    });
    const conflicts = detectImportConflicts({ incoming, existing });
    expect(
      conflicts.some((c) => c.reason === "not_present_in_incoming")
    ).toBe(true);
  });
});
