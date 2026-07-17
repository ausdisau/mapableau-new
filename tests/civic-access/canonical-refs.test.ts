import { describe, expect, it } from "vitest";

import {
  REGISTRY_BOUNDARY,
  accessPlaceCanonicalRef,
  parseCanonicalRef,
} from "@/lib/civic-access/canonical-refs";

describe("civic canonical refs", () => {
  it("formats AccessPlace refs without creating place rows", () => {
    expect(accessPlaceCanonicalRef("place_123")).toBe("access_place:place_123");
  });

  it("parses known systems", () => {
    expect(parseCanonicalRef("access_place:abc")).toEqual({
      system: "access_place",
      externalId: "abc",
    });
    expect(parseCanonicalRef("accessibility_ops_asset:xyz")).toEqual({
      system: "accessibility_ops_asset",
      externalId: "xyz",
    });
  });

  it("rejects malformed refs", () => {
    expect(parseCanonicalRef("nocolon")).toBeNull();
    expect(parseCanonicalRef("unknown_system:id")).toBeNull();
  });

  it("documents registry boundary with AccessibilityOps", () => {
    expect(REGISTRY_BOUNDARY.forbid).toContain("AccessPlace");
  });
});
