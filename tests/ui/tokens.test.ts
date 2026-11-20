import { describe, expect, it } from "vitest";

import {
  contrastRatio,
  mapableAaaContrastPairs,
  mapableAaaFocusRingClass,
  mapableCareEyebrowClass,
  mapableCareFocusRing,
  mapableColors,
  mapableTypography,
} from "@mapable/ui";

describe("@mapable/ui tokens", () => {
  it("exports canonical brand colors", () => {
    expect(mapableColors.brandBlue).toBe("#005B7F");
    expect(mapableColors.brandYellow).toBe("#F8C51C");
    expect(mapableColors.navy).toBe("#0C1833");
    expect(mapableColors.brandGreen).toBe("#00A979");
    expect(mapableColors.brandGreenText).toBe("#005A42");
    expect(mapableColors.bodyText).toBe("#334155");
  });

  it("keeps every approved AAA contrast pair above its minimum", () => {
    for (const pair of mapableAaaContrastPairs) {
      const ratio = contrastRatio(pair.fg, pair.bg);
      expect(
        ratio,
        `${pair.name}: ${pair.fg} on ${pair.bg} = ${ratio.toFixed(2)} (need ≥${pair.min})`,
      ).toBeGreaterThanOrEqual(pair.min);
    }
  });

  it("uses a dual focus ring (brand blue + yellow offset)", () => {
    expect(mapableAaaFocusRingClass).toContain("ring-[#005B7F]");
    expect(mapableAaaFocusRingClass).toContain("ring-offset-[#F8C51C]");
    expect(mapableAaaFocusRingClass).toContain("ring-2");
    expect(mapableCareFocusRing).toBe(mapableAaaFocusRingClass);
    expect(mapableCareEyebrowClass).toContain("uppercase");
  });

  it("documents 1.4.8 typography constraints", () => {
    expect(mapableTypography.maxLineLengthCh).toBeLessThanOrEqual(80);
    expect(mapableTypography.lineHeight).toBeGreaterThanOrEqual(1.5);
    expect(mapableTypography.leadClass).toContain("max-w-[80ch]");
    expect(mapableTypography.bodyClass).toContain("leading-[1.5]");
  });
});
