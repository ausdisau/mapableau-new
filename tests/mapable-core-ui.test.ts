import { describe, expect, it } from "vitest";

import {
  CORE_CAPABILITIES,
  CORE_CAPABILITIES_SECTION,
} from "@/lib/core-ui/core-capabilities";
import {
  CORE_ECOSYSTEM_APPS,
  CORE_ECOSYSTEM_SECTION,
} from "@/lib/core-ui/ecosystem";
import {
  CORE_CIVIC_LINKS,
  CORE_HUB_HERO,
  CORE_HUB_SECTIONS,
  CORE_PLATFORM_LINKS,
} from "@/lib/core-ui/navigation";
import {
  CORE_PILLARS_SECTION,
  CORE_SERVICE_PILLARS,
} from "@/lib/core-ui/pillars";
import { PROVIDER_NAV_LINKS } from "@/lib/core-ui/provider-nav";

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
    expect(titles).toContain("Your services");
    expect(titles).toContain("Public accountability");
  });

  it("provider nav includes care and transport", () => {
    expect(PROVIDER_NAV_LINKS.some((l) => l.href === "/provider/care")).toBe(
      true
    );
    expect(PROVIDER_NAV_LINKS.some((l) => l.href === "/provider/transport")).toBe(
      true
    );
    expect(PROVIDER_NAV_LINKS.some((l) => l.href === "/provider/billing")).toBe(
      true
    );
  });
});

describe("Core UI hub hero", () => {
  it("aligns eyebrow with Australian Disability Ltd framing", () => {
    expect(CORE_HUB_HERO.eyebrow).toContain("Australian Disability Ltd");
    expect(CORE_HUB_HERO.description).toMatch(/single secure account/i);
  });
});

describe("Core UI capabilities", () => {
  it("exposes four backbone tiles with live routes", () => {
    expect(CORE_CAPABILITIES).toHaveLength(4);
    expect(CORE_CAPABILITIES.map((c) => c.id)).toEqual([
      "account",
      "billing",
      "messaging",
      "support",
    ]);
    expect(CORE_CAPABILITIES.every((c) => c.href.startsWith("/"))).toBe(true);
    expect(CORE_CAPABILITIES.find((c) => c.id === "billing")?.href).toBe(
      "/dashboard/billing"
    );
    expect(CORE_CAPABILITIES.find((c) => c.id === "messaging")?.href).toBe(
      "/dashboard/messages"
    );
    expect(CORE_CAPABILITIES.find((c) => c.id === "support")?.href).toBe(
      "/dashboard/safety/support"
    );
  });

  it("has a capabilities section title", () => {
    expect(CORE_CAPABILITIES_SECTION.title).toBe("MapAble Core");
  });
});

describe("Core UI service pillars", () => {
  it("lists care, transport and employment with live primary links", () => {
    expect(CORE_SERVICE_PILLARS).toHaveLength(3);
    const byId = Object.fromEntries(CORE_SERVICE_PILLARS.map((p) => [p.id, p]));
    expect(byId.care.primaryHref).toBe("/dashboard/care");
    expect(byId.transport.primaryHref).toBe("/dashboard/transport");
    expect(byId.employment.primaryHref).toBe("/dashboard/jobs");
  });

  it("has a pillars section description", () => {
    expect(CORE_PILLARS_SECTION.title).toBe("Service pillars");
  });
});

describe("Core UI ecosystem roadmap", () => {
  it("lists five satellite apps as roadmap-only", () => {
    expect(CORE_ECOSYSTEM_APPS).toHaveLength(5);
    const names = CORE_ECOSYSTEM_APPS.map((a) => a.name);
    expect(names).toContain("MapAble Independence");
    expect(names).toContain("MapAble Moves");
    expect(names).toContain("MapAble Emergency");
    expect(names).toContain("MapAble Foods");
    expect(names).toContain("MapAble News");
    expect(CORE_ECOSYSTEM_APPS.every((a) => a.status === "roadmap")).toBe(true);
    expect(CORE_ECOSYSTEM_APPS.every((a) => !("href" in a && a.href))).toBe(true);
  });

  it("uses ecosystem anchor id for hub section", () => {
    expect(CORE_ECOSYSTEM_SECTION.id).toBe("ecosystem");
  });
});
