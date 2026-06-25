import { describe, expect, it } from "vitest";

import {
  getAllVerticals,
  getExistingVerticals,
  getPriorityVerticals,
  getProposedVerticals,
  getUntappedVerticalsInPriorityOrder,
  getVerticalById,
  getVerticalBySlug,
  getVerticalsByIds,
  UNTAPPED_PRIORITY_ORDER,
} from "@/lib/mapable/verticals";

describe("MapAble vertical registry", () => {
  it("includes all expected verticals", () => {
    const all = getAllVerticals();
    expect(all.length).toBeGreaterThanOrEqual(20);

    const ids = all.map((v) => v.id);
    expect(ids).toContain("core");
    expect(ids).toContain("planops");
    expect(ids).toContain("intelligence");
  });

  it("getVerticalBySlug resolves known slugs", () => {
    expect(getVerticalBySlug("planops")?.name).toBe("MapAble PlanOps");
    expect(getVerticalBySlug("access-pass")?.shortName).toBe("Access Pass");
    expect(getVerticalBySlug("unknown")).toBeUndefined();
  });

  it("getVerticalById resolves known ids", () => {
    expect(getVerticalById("home")?.href).toBe("/home");
    expect(getVerticalById("accessops")?.status).toBe("pilot");
  });

  it("getExistingVerticals excludes proposed/pilot untapped", () => {
    const existing = getExistingVerticals();
    expect(existing.some((v) => v.id === "care")).toBe(true);
    expect(existing.some((v) => v.id === "planops")).toBe(false);
  });

  it("getProposedVerticals includes pilot and proposed", () => {
    const proposed = getProposedVerticals();
    expect(proposed.some((v) => v.id === "planops")).toBe(true);
    expect(proposed.some((v) => v.id === "life")).toBe(true);
    expect(proposed.some((v) => v.id === "care")).toBe(false);
  });

  it("getPriorityVerticals returns priority 1-2 proposed/pilot verticals", () => {
    const priority = getPriorityVerticals();
    expect(priority.every((v) => v.priority <= 2)).toBe(true);
    expect(priority.some((v) => v.id === "planops")).toBe(true);
    expect(priority.some((v) => v.id === "home")).toBe(true);
  });

  it("getVerticalsByIds preserves order and skips unknown", () => {
    const linked = getVerticalsByIds(["care", "unknown", "transport"]);
    expect(linked).toHaveLength(2);
    expect(linked[0]?.id).toBe("care");
    expect(linked[1]?.id).toBe("transport");
  });

  it("untapped priority order matches strategic ranking", () => {
    const ordered = getUntappedVerticalsInPriorityOrder();
    expect(ordered.map((v) => v.id)).toEqual([...UNTAPPED_PRIORITY_ORDER]);
    expect(ordered[0]?.id).toBe("planops");
  });

  it("every vertical has required fields", () => {
    for (const v of getAllVerticals()) {
      expect(v.id).toBeTruthy();
      expect(v.slug).toBeTruthy();
      expect(v.name).toBeTruthy();
      expect(v.coreFeatures.length).toBeGreaterThanOrEqual(3);
      expect(v.primaryCta.label).toBeTruthy();
      expect(v.primaryCta.href).toBeTruthy();
      expect(v.href).toBeTruthy();
    }
  });
});
