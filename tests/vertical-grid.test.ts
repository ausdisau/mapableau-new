import { describe, expect, it } from "vitest";

import { filterVerticals } from "@/components/marketing/VerticalGrid";
import { getAllVerticals, getVerticalById } from "@/lib/mapable/verticals";

describe("filterVerticals", () => {
  const all = getAllVerticals();

  it("returns all verticals for 'all' filter", () => {
    expect(filterVerticals(all, "all")).toHaveLength(all.length);
  });

  it("filters existing verticals", () => {
    const existing = filterVerticals(all, "existing");
    expect(existing.every((v) => v.status === "existing")).toBe(true);
    expect(existing.some((v) => v.id === "care")).toBe(true);
  });

  it("filters pilot verticals", () => {
    const pilot = filterVerticals(all, "pilot");
    expect(pilot.every((v) => v.status === "pilot")).toBe(true);
    expect(pilot.some((v) => v.id === "planops")).toBe(true);
  });

  it("filters high priority", () => {
    const high = filterVerticals(all, "high-priority");
    expect(high.every((v) => v.priority <= 2)).toBe(true);
  });

  it("filters low complexity", () => {
    const low = filterVerticals(all, "low-complexity");
    expect(low.every((v) => v.implementationComplexity === "low")).toBe(true);
  });
});

describe("vertical card data", () => {
  it("planops has priority 1 and pilot status", () => {
    const planops = getVerticalById("planops");
    expect(planops?.priority).toBe(1);
    expect(planops?.status).toBe("pilot");
  });
});
