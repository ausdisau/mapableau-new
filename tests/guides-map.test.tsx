/**
 * @vitest-environment jsdom
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { GuideFilters, type GuideFiltersState } from "@/components/guides/GuideFilters";
import { GuideList } from "@/components/guides/GuideList";
import {
  accessGuides,
  filterAccessGuides,
  formatAccessGuideStatusKey,
  getAccessGuideMarkerKind,
  getCapitalAccessGuides,
  getGuidesForMap,
} from "@/lib/resources/access-guides-data";

describe("access guides map data", () => {
  it("includes coordinates and ids for every guide", () => {
    expect(accessGuides).toHaveLength(61);
    expect(getGuidesForMap()).toHaveLength(61);
    expect(getCapitalAccessGuides()).toHaveLength(8);

    for (const guide of accessGuides) {
      expect(guide.id).toMatch(/^guide-/);
      expect(Number.isFinite(guide.latitude)).toBe(true);
      expect(Number.isFinite(guide.longitude)).toBe(true);
      expect(guide.title).toContain("Accessibility Guide");
      expect(guide.cityOrTown).toBe(guide.city);
      expect(guide.tier).toBe(guide.priorityTier);
      expect(guide.summary).toBe(guide.launchAngle);
      expect(guide.keyAccessThemes.length).toBeGreaterThan(0);
      expect(guide.href).toMatch(/^\/guides\//);
    }
  });

  it("filters guides and formats status labels", () => {
    expect(filterAccessGuides({ state: "ACT" }).length).toBeGreaterThan(0);
    expect(filterAccessGuides({ tier: "Tier 1" }).length).toBeGreaterThan(0);
    expect(
      filterAccessGuides({ status: "needs_verification" }).length,
    ).toBeGreaterThan(0);
    expect(filterAccessGuides({ query: "canber" })[0]?.city).toBe("Canberra");
    expect(formatAccessGuideStatusKey("partner_supplied")).toBe(
      "Partner supplied",
    );
    expect(formatAccessGuideStatusKey("community_reported")).toBe(
      "Community reported",
    );
    const canberra = accessGuides.find((g) => g.city === "Canberra")!;
    expect(getAccessGuideMarkerKind(canberra).kind).toBe("capital");
  });
});

describe("guide map components", () => {
  it("renders filters with pressed state and live count", () => {
    const filters: GuideFiltersState = {
      query: "",
      state: "ACT",
      tier: null,
      status: null,
    };
    render(
      <GuideFilters
        filters={filters}
        states={["ACT", "NSW"]}
        tiers={["Capital launch", "Tier 1"]}
        statuses={["drafted", "needs_verification"]}
        resultCount={1}
        onChange={() => undefined}
      />,
    );
    expect(
      screen.getByRole("button", { name: "ACT" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByText(/Showing 1 guide/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "All states" }));
  });

  it("renders guide list cards as crawlable links", () => {
    const guides = getCapitalAccessGuides();
    render(
      <GuideList
        guides={guides}
        selectedGuideId={guides[0]?.id ?? null}
        isFiltered={false}
        onSelectGuide={() => undefined}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Capital Access Guides" }),
    ).toBeTruthy();
    const link = screen.getByRole("link", { name: /Canberra/i });
    expect(link.getAttribute("href")).toBe(
      "/guides/act/canberra-accessibility-guide",
    );
  });
});

describe("guides page contract", () => {
  it("wires the map explorer after the intro", () => {
    const pagePath = join(process.cwd(), "app/(marketing)/guides/page.tsx");
    const explorerPath = join(
      process.cwd(),
      "components/guides/GuidesMapExplorer.tsx",
    );
    expect(existsSync(pagePath)).toBe(true);
    expect(existsSync(explorerPath)).toBe(true);
    const source = readFileSync(pagePath, "utf8");
    const explorerSource = readFileSync(explorerPath, "utf8");
    expect(source).toContain("Explore Access Guides on the map");
    expect(source).toContain("GuidesMapExplorer");
    expect(explorerSource).toContain("Skip map and browse guide list");
    expect(source).toContain("application/ld+json");
    expect(source).toContain("partner supplied");
    expect(source).toContain("community reported");
    expect(source).not.toContain("requireAuth");
  });
});
