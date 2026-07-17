import { describe, expect, it } from "vitest";

import {
  CLASSIFIED_PLACEHOLDERS,
  classifyPlaceholder,
  placeholdersByClassification,
} from "@/lib/release-candidate/placeholders/classifier";

describe("RC1 placeholder classification", () => {
  it("classifies the known RC1 placeholder set", () => {
    expect(
      CLASSIFIED_PLACEHOLDERS.map((placeholder) => placeholder.id).sort(),
    ).toEqual([
      "accessops-feeds-off",
      "demo-access-routes",
      "ndia-provider-adapter-stub",
      "outdoor-routing-disabled",
      "partner-webhook-scaffolding",
      "status-subscriptions-disabled",
    ]);
  });

  it("keeps NDIA and demo data sandbox-only", () => {
    expect(
      classifyPlaceholder("ndia-provider-adapter-stub")?.classification,
    ).toBe("sandbox-only");
    expect(classifyPlaceholder("demo-access-routes")?.classification).toBe(
      "sandbox-only",
    );
  });

  it("keeps operational AccessOps flags disabled unless explicitly approved", () => {
    expect(
      placeholdersByClassification("disabled")
        .map((entry) => entry.id)
        .sort(),
    ).toEqual([
      "accessops-feeds-off",
      "outdoor-routing-disabled",
      "status-subscriptions-disabled",
    ]);
  });
});
