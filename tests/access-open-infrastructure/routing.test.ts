import { afterEach, describe, expect, it } from "vitest";

import { SANDBOX_GRAPH } from "@/lib/access/navigate/fixture/sandbox-graph";
import { DEFAULT_MOBILITY_CONSTRAINTS } from "@/lib/access/navigate/types";
import { applyMapAbleCompatibilityOverlay } from "@/lib/integrations/access/routing/compatibility-overlay";
import {
  assertNoSafeClaim,
  buildRouteEvidenceSummary,
} from "@/lib/integrations/access/routing/evidence-summary";
import { sandboxRouteProvider } from "@/lib/integrations/access/routing/sandbox-provider";

describe("accessible routing", () => {
  afterEach(() => {
    delete process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED;
    delete process.env.MAPABLE_ACCESSIBLE_ROUTING_ENABLED;
  });

  it("reports unknown segments and never SAFE", async () => {
    process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED = "true";
    process.env.MAPABLE_ACCESSIBLE_ROUTING_ENABLED = "true";

    const result = await sandboxRouteProvider.planRoute({
      fromNodeId: "n-central",
      toNodeId: "n-townhall",
      constraints: DEFAULT_MOBILITY_CONSTRAINTS,
    });
    expect(result.evidenceSummary.safetyClaim).toBe("none");
    expect(result.evidenceSummary.accessAssessment).not.toBe("SAFE");
    assertNoSafeClaim(result.evidenceSummary);
  });

  it("overlay rejects engine accessible bypass", () => {
    const segment = SANDBOX_GRAPH.segments[0];
    const overlay = applyMapAbleCompatibilityOverlay(
      { ...segment, widthMm: null, stairs: 5 },
      {
        ...DEFAULT_MOBILITY_CONSTRAINTS,
        stairsAllowed: false,
      },
      true,
    );
    expect(overlay.engineClaimedAccessible).toBe(true);
    expect(overlay.allowed).toBe(false);
  });

  it("summary counts unknown segments", () => {
    const segments = SANDBOX_GRAPH.segments.map((s) => ({
      ...s,
      widthMm: null,
      surfaceType: "UNKNOWN" as const,
    }));
    const summary = buildRouteEvidenceSummary("sandbox", segments);
    expect(summary.unknownSegmentCount).toBeGreaterThan(0);
    expect(summary.warnings.some((w) => /not a safety guarantee/i.test(w))).toBe(
      true,
    );
  });
});
