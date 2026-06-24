import { describe, expect, it, vi } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { phase12Config } from "@/lib/config/phase12";

describe("Phase 12 config", () => {
  it("accountability portal on by default", () => {
    expect(phase12Config.nationalAccountabilityPortalEnabled).toBe(true);
  });
  it("API ecosystem at scale off by default", () => {
    expect(phase12Config.certifiedApiEcosystemAtScaleEnabled).toBe(false);
  });
  it("constitutional safeguards on by default", () => {
    expect(phase12Config.constitutionalSafeguardsEnabled).toBe(true);
  });
});

describe("Phase 12 permissions", () => {
  it("grants accountability publish to admin", () => {
    expect(hasPermission("mapable_admin", "accountability:publish")).toBe(true);
  });
  it("grants safeguards read to participant", () => {
    expect(hasPermission("participant", "safeguards:read")).toBe(true);
  });
  it("grants transport investment read to participant", () => {
    expect(hasPermission("participant", "transport_investment:read")).toBe(
      true
    );
  });
});

describe("constitutional safeguards", () => {
  it("returns articles when enabled", async () => {
    const prismaMod = await import("@/lib/prisma");
    vi.spyOn(prismaMod.prisma.constitutionalSafeguard, "upsert").mockResolvedValue(
      {} as never
    );
    vi.spyOn(prismaMod.prisma.constitutionalSafeguard, "findMany").mockResolvedValue([
      {
        articleKey: "human_review",
        title: "Human review for high-impact decisions",
        status: "active",
        sortOrder: 1,
      },
    ] as never);

    const { listActiveSafeguards } = await import(
      "@/lib/constitutional-safeguards/safeguards-service"
    );
    const articles = await listActiveSafeguards();
    expect(Array.isArray(articles)).toBe(true);
    expect(articles.length).toBeGreaterThan(0);
    expect(phase12Config.constitutionalSafeguardsEnabled).toBe(true);
  });
});
