import { describe, expect, it } from "vitest";

import { CORE_HUB_SECTIONS, CORE_PLATFORM_LINKS } from "@/lib/core-ui/navigation";

describe("MapAble Core hub", () => {
  it("includes /core in platform links", () => {
    expect(CORE_PLATFORM_LINKS.some((l) => l.href === "/core")).toBe(true);
  });

  it("hub sections link to dashboard and Ask MapAble", () => {
    const hrefs = CORE_HUB_SECTIONS.flatMap((s) => s.links.map((l) => l.href));
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/ask");
  });

  it("includes Ask MapAble in platform links", () => {
    expect(CORE_PLATFORM_LINKS.some((l) => l.href === "/ask")).toBe(true);
  });
});
