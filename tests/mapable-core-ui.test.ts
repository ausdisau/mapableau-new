import { describe, expect, it } from "vitest";

import {
  CORE_CIVIC_LINKS,
  CORE_HUB_SECTIONS,
  CORE_PLATFORM_LINKS,
  getCoreHubSections,
} from "@/lib/platform/core-ui/navigation";
import { PROVIDER_NAV_LINKS } from "@/lib/platform/core-ui/provider-nav";

describe("Core UI navigation", () => {
  it("includes civic transparency routes", () => {
    expect(CORE_CIVIC_LINKS.some((l) => l.href === "/transparency")).toBe(true);
    expect(CORE_CIVIC_LINKS.some((l) => l.href === "/status")).toBe(true);
  });

  it("includes platform entry points", () => {
    expect(CORE_PLATFORM_LINKS.some((l) => l.href === "/dashboard")).toBe(true);
    expect(CORE_PLATFORM_LINKS.some((l) => l.href === "/login")).toBe(true);
  });

  it("hub sections cover services and civic", () => {
    const titles = CORE_HUB_SECTIONS.map((s) => s.title);
    expect(titles).toContain("MapAble services");
    expect(titles).toContain("Your services");
    expect(titles).toContain("Public accountability");
  });

  it("uses module entry routes for care, transport, and jobs (Year-One)", () => {
    const hrefs = CORE_HUB_SECTIONS.flatMap((s) => s.links.map((l) => l.href));
    expect(hrefs).toContain("/care");
    expect(hrefs).toContain("/transport");
    expect(hrefs).toContain("/dashboard/jobs");
    expect(hrefs).not.toContain("/marketplace");
    expect(hrefs).not.toContain("/dashboard/care");
    expect(hrefs).not.toContain("/vault");
  });

  it("adds the information vault only when the flag is on", () => {
    expect(
      getCoreHubSections({ ...process.env, MAPABLE_PARTICIPANT_INFORMATION_VAULT_ENABLED: "false" }).flatMap(
        (s) => s.links.map((l) => l.href),
      ),
    ).not.toContain("/vault");
    const hrefs = getCoreHubSections({
      ...process.env,
      MAPABLE_PARTICIPANT_INFORMATION_VAULT_ENABLED: "true",
    }).flatMap((s) => s.links.map((l) => l.href));
    expect(hrefs).toContain("/vault");
    expect(hrefs).toContain("/data-vault");
  });

  it("provider nav includes consolidated section hubs", () => {
    expect(PROVIDER_NAV_LINKS.some((l) => l.href === "/provider/care")).toBe(
      true
    );
    expect(PROVIDER_NAV_LINKS.some((l) => l.href === "/provider/transport")).toBe(
      true
    );
    expect(PROVIDER_NAV_LINKS.some((l) => l.href === "/provider/billing")).toBe(
      true
    );
    expect(PROVIDER_NAV_LINKS.some((l) => l.href === "/provider/claiming")).toBe(
      true
    );
    expect(PROVIDER_NAV_LINKS.some((l) => l.href === "/provider/developer")).toBe(
      true
    );
    // Section hubs only — keep top-level nav lean (Developer partner API hub included).
    expect(PROVIDER_NAV_LINKS.length).toBeLessThanOrEqual(11);
  });
});
