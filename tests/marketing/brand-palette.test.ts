import { describe, expect, it } from "vitest";

import {
  marketingColors,
  marketingFocusRingClass,
  marketingPrimaryCtaClass,
} from "@/lib/marketing/brand-palette";
import {
  mapableCareFocusRing,
  mapableCareEyebrowClass,
  mapableCarePageBgClass,
} from "@/lib/marketing/mapable-care-tokens";
import { mapableColors } from "@mapable/ui/tokens";

describe("marketing brand palette", () => {
  it("exports logo-derived marketing tokens from the redesign plan", () => {
    expect(marketingColors.navy).toBe("#0C1833");
    expect(marketingColors.orange).toBe("#F26A21");
    expect(marketingColors.orangeDark).toBe("#D45512");
    expect(marketingColors.royalBlue).toBe("#3B5BDB");
    expect(marketingColors.violet).toBe("#8B4DFF");
    expect(marketingColors.surface).toBe("#F7F8FC");
  });

  it("uses orange CTAs with navy text and orange focus rings", () => {
    expect(marketingFocusRingClass).toContain("#F26A21");
    expect(marketingPrimaryCtaClass).toContain("bg-[#F26A21]");
    expect(marketingPrimaryCtaClass).toContain("text-[#0C1833]");
    expect(mapableCareFocusRing).toContain("#F26A21");
    expect(mapableCareEyebrowClass).toContain("#3B5BDB");
    expect(mapableCarePageBgClass).toContain("#F7F8FC");
  });

  it("leaves @mapable/ui app tokens on teal/gold", () => {
    expect(mapableColors.brandBlue).toBe("#005B7F");
    expect(mapableColors.brandYellow).toBe("#F8C51C");
  });
});
