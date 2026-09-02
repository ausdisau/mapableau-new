import { describe, expect, it } from "vitest";

import {
  mapableColors,
  mapableCareFocusRing,
  mapableCareEyebrowClass,
} from "@mapable/ui";

describe("@mapable/ui tokens", () => {
  it("exports canonical brand colors", () => {
    expect(mapableColors.brandBlue).toBe("#005B7F");
    expect(mapableColors.brandYellow).toBe("#F8C51C");
    expect(mapableColors.navy).toBe("#0C1833");
  });

  it("includes WCAG focus ring classes", () => {
    expect(mapableCareFocusRing).toContain("focus-visible:ring-2");
    expect(mapableCareEyebrowClass).toContain("uppercase");
  });
});
