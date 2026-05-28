import { describe, expect, it } from "vitest";

import {
  PUBLIC_LAUNCH_CHECKLIST,
  PUBLIC_LAUNCH_CHECKLIST_CODES,
} from "@/lib/launch-readiness/public-launch-checklist";
import { buildLaunchGapCatalogEntries } from "@/lib/platform-gaps/launch-gap-catalog";
import { PLATFORM_GAP_CATALOG } from "@/lib/platform-gaps/gap-catalog";

describe("public launch checklist", () => {
  it("has unique codes and full launch minimum size", () => {
    const codes = PUBLIC_LAUNCH_CHECKLIST_CODES;
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.length).toBe(22);
    expect(codes).toContain("PUBLIC_LAUNCH_GO_NO_GO");
    expect(codes).toContain("STRIPE_PRODUCTION_VERIFIED");
  });

  it("includes runbook paths for every item", () => {
    for (const item of PUBLIC_LAUNCH_CHECKLIST) {
      expect(item.runbookPath).toMatch(/^\/docs\/runbooks\/launch\//);
    }
  });

  it("mirrors every checklist row to platform gaps", () => {
    const launchGaps = buildLaunchGapCatalogEntries();
    expect(launchGaps.length).toBe(PUBLIC_LAUNCH_CHECKLIST.length);
    for (const item of PUBLIC_LAUNCH_CHECKLIST) {
      const gap = PLATFORM_GAP_CATALOG.find((e) => e.code === `launch.${item.code}`);
      expect(gap, `missing gap for ${item.code}`).toBeDefined();
      expect(gap?.launchItemCode).toBe(item.code);
      expect(gap?.detector).toBe("launch_item_sync");
    }
  });
});
