import { describe, expect, it } from "vitest";

import { getMapAbleAppMenuItems } from "@/lib/navigation/mapable-app-menu";

describe("MapAble app menu", () => {
  it("shows exactly nine non-admin shortcuts with Support fallback", () => {
    const items = getMapAbleAppMenuItems("participant");

    expect(items).toHaveLength(9);
    expect(items.map((item) => item.label)).toContain("Support");
    expect(items.map((item) => item.label)).not.toContain("Admin");
  });

  it("shows the Admin shortcut for admins", () => {
    const items = getMapAbleAppMenuItems("mapable_admin");

    expect(items).toHaveLength(9);
    expect(items.map((item) => item.label)).toContain("Admin");
    expect(items.map((item) => item.label)).not.toContain("Support");
  });
});
