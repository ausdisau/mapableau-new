import { describe, expect, it } from "vitest";

import {
  listPlatformIntelligenceDomains,
  listPlatformJourneyGraphs,
} from "@/lib/care-intelligence/platform-registry";

describe("platform intelligence registry", () => {
  it("registers five unique bounded domain packs", () => {
    const domains = listPlatformIntelligenceDomains();
    expect(domains).toHaveLength(5);
    expect(new Set(domains.map((domain) => domain.id)).size).toBe(5);
    expect(domains.map((domain) => domain.id)).toEqual([
      "care",
      "transport",
      "employment",
      "foods",
      "rehabilitation",
    ]);
  });

  it("distinguishes runnable research from design-ready domains", () => {
    const domains = listPlatformIntelligenceDomains();
    expect(domains.find((domain) => domain.id === "care")?.status).toBe(
      "synthetic_live",
    );
    expect(
      domains
        .filter((domain) => domain.id !== "care")
        .every((domain) => domain.status === "design_ready"),
    ).toBe(true);
  });

  it("gives every domain capabilities, boundaries and a vertical slice", () => {
    for (const domain of listPlatformIntelligenceDomains()) {
      expect(domain.capabilities.length).toBeGreaterThanOrEqual(5);
      expect(domain.hardBoundaries.length).toBeGreaterThanOrEqual(3);
      expect(domain.firstVerticalSlice.length).toBeGreaterThan(20);
      expect(domain.scenarioCount).toBeGreaterThan(0);
    }
  });

  it("registers Workday and Daily Living cross-domain graphs", () => {
    const graphs = listPlatformJourneyGraphs();
    expect(graphs.map((graph) => graph.id)).toEqual([
      "workday",
      "daily_living",
    ]);
    expect(graphs.every((graph) => graph.domains.length >= 5)).toBe(true);
    expect(graphs.every((graph) => graph.stopBoundary.includes("stop"))).toBe(
      true,
    );
  });
});
