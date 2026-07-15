/**
 * @vitest-environment jsdom
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import {
  SuburbGuideFilters,
  type SuburbGuideFiltersState,
} from "@/components/guides/suburb/SuburbGuideFilters";
import { SuburbGuideStatusBadge } from "@/components/guides/suburb/SuburbGuideStatusBadge";
import {
  filterSuburbGuides,
  formatSuburbGuideStatus,
  getIndexableSuburbGuides,
  getSuburbGuideByStateSlug,
  getSuburbGuideStates,
  isSuburbGuideIndexable,
  suburbAccessGuides,
  SUBURB_GUIDE_DISCLAIMER,
} from "@/lib/resources/suburb-access-guides-data";

describe("suburb access guides data", () => {
  it("seed guides include required SAL fields and routes", () => {
    expect(suburbAccessGuides.length).toBeGreaterThanOrEqual(8);
    expect(getSuburbGuideStates().length).toBeGreaterThanOrEqual(6);

    for (const guide of suburbAccessGuides) {
      expect(guide.salCode).toMatch(/^SAL\d+/);
      expect(guide.slug.length).toBeGreaterThan(0);
      expect(guide.stateSlug.length).toBeGreaterThan(0);
      expect(guide.href).toBe(
        `/guides/suburbs/${guide.stateSlug}/${guide.slug}`,
      );
      expect(guide.mapHref).toBe(`${guide.href}/map`);
      expect(guide.reportHref).toBe(`${guide.href}/report-update`);
      expect(Number.isFinite(guide.centroid.latitude)).toBe(true);
      expect(Number.isFinite(guide.centroid.longitude)).toBe(true);
      expect(guide.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(guide.confidenceScore).toBeLessThanOrEqual(100);
      expect(guide.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide.dataSources.length).toBeGreaterThan(0);
    }
  });

  it("filters by state, status, theme and query", () => {
    expect(filterSuburbGuides({ stateSlug: "act" }).length).toBeGreaterThan(0);
    expect(
      filterSuburbGuides({ status: "draft" }).every(
        (g) => g.guideStatus === "draft",
      ),
    ).toBe(true);
    expect(
      filterSuburbGuides({ theme: "transport" }).every((g) =>
        g.accessThemes.includes("transport"),
      ),
    ).toBe(true);
    expect(filterSuburbGuides({ query: "acton" })[0]?.name).toMatch(
      /Acton/i,
    );
    expect(formatSuburbGuideStatus("mapable-verified")).toBe(
      "MapAble verified",
    );
    expect(formatSuburbGuideStatus("draft")).toBe("Draft guide");
    expect(formatSuburbGuideStatus("data-enriched")).toBe("Data-enriched");
  });

  it("keeps thin drafts out of the indexable set", () => {
    const drafts = suburbAccessGuides.filter(
      (g) =>
        g.guideStatus === "draft" ||
        g.guideStatus === "not-started" ||
        g.guideStatus === "needs-local-verification",
    );
    for (const guide of drafts) {
      expect(isSuburbGuideIndexable(guide)).toBe(false);
    }
    expect(getIndexableSuburbGuides().length).toBeGreaterThan(0);
    expect(
      getIndexableSuburbGuides().every(isSuburbGuideIndexable),
    ).toBe(true);
  });

  it("includes Cursor Pack starter suburbs", () => {
    const starters = [
      ["act", "braddon"],
      ["nsw", "parramatta"],
      ["vic", "brunswick"],
      ["qld", "south-brisbane"],
    ] as const;
    for (const [state, slug] of starters) {
      expect(getSuburbGuideByStateSlug(state, slug)?.id).toBe(
        `${state}-${slug}`,
      );
    }
  });

  it("exports the required advisory disclaimer", () => {
    expect(SUBURB_GUIDE_DISCLAIMER).toContain(
      "not a guarantee of access",
    );
    expect(SUBURB_GUIDE_DISCLAIMER).toContain("NDIS advice");
  });
});

describe("suburb guide UI pieces", () => {
  it("renders status badge labels", () => {
    render(<SuburbGuideStatusBadge status="needs-local-verification" />);
    expect(screen.getByText("Needs local verification")).toBeTruthy();
  });

  it("announces filter result counts", () => {
    const filters: SuburbGuideFiltersState = {
      query: "",
      stateSlug: "act",
      status: null,
      theme: null,
    };
    render(
      <SuburbGuideFilters
        filters={filters}
        states={[
          { slug: "act", label: "ACT" },
          { slug: "nsw", label: "NSW" },
        ]}
        statuses={["draft", "mapable-verified"]}
        themes={["transport", "toilets"]}
        resultCount={3}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByText(/Showing 3 suburb guides/i)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "ACT" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });
});

describe("suburb guide routes and design contracts", () => {
  it("ships required route and component files", () => {
    const root = process.cwd();
    const required = [
      "app/(marketing)/guides/suburbs/page.tsx",
      "app/(marketing)/guides/suburbs/[state]/page.tsx",
      "app/(marketing)/guides/suburbs/[state]/[slug]/page.tsx",
      "app/(marketing)/guides/suburbs/[state]/[slug]/map/page.tsx",
      "app/(marketing)/guides/suburbs/[state]/[slug]/report-update/page.tsx",
      "app/api/guides/suburbs/report-update/route.ts",
      "app/guides/suburbs/sitemap.ts",
      "src/data/suburbAccessGuides.ts",
      "src/data/suburbAccessGuides.sample.ts",
      "src/types/suburbAccessGuide.ts",
      "src/lib/guides/index.ts",
      "src/components/guides/suburbs/index.ts",
      "types/suburb-access-guide.ts",
      "lib/resources/suburb-access-guides-data.ts",
      "lib/guides/suburb-guide-utils.ts",
      "components/guides/suburb/SuburbGuideCard.tsx",
      "components/guides/suburb/SuburbGuideStatusBadge.tsx",
      "components/guides/suburb/SuburbGuideMap.tsx",
      "components/guides/suburb/SuburbGuidesIndexMap.tsx",
      "components/guides/suburb/SuburbGuideQuickFacts.tsx",
      "components/guides/suburb/SuburbGuideSection.tsx",
      "components/guides/suburb/SuburbGuideReportUpdateCTA.tsx",
      "components/guides/suburb/SuburbGuideFilters.tsx",
      "components/guides/suburb/SuburbGuideNearbyLinks.tsx",
      "tools/import-abs-sal-geojson.ts",
      "docs/guides/suburbs/VERIFICATION_MODEL.md",
    ];    for (const relative of required) {
      expect(existsSync(join(root, relative))).toBe(true);
    }
  });

  it("uses MapLibre style env rather than OSM Foundation tiles alone", () => {
    const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");
    expect(envExample).toContain("NEXT_PUBLIC_MAP_STYLE_URL");
    expect(envExample).toContain("NEXT_PUBLIC_MAP_TILE_URL");
    expect(envExample).toMatch(/production-tiles|self-hosted|commercial/i);

    const mapPage = readFileSync(
      join(
        process.cwd(),
        "app/(marketing)/guides/suburbs/[state]/[slug]/map/page.tsx",
      ),
      "utf8",
    );
    expect(mapPage).toContain("Skip map and browse guide list");

    const indexPage = readFileSync(
      join(process.cwd(), "app/(marketing)/guides/suburbs/page.tsx"),
      "utf8",
    );
    expect(indexPage).toContain("Skip map and browse guide list");
  });
});
