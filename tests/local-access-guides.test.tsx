/**
 * @vitest-environment jsdom
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapAbleCareMarketingFooter } from "@/components/marketing/MapAbleCareMarketingFooter";
import { LocalAccessGuidesDirectory } from "@/components/resources/LocalAccessGuidesDirectory";
import { getLocalAccessHrefForCity } from "@/lib/demo/local-access-pages";
import { footerResourceLinks } from "@/lib/marketing/mapable-care-combined-data";
import {
  accessGuideDownloads,
  accessGuideStatusLabel,
  accessGuides,
  getAccessGuideBySlug,
  getAccessGuideStates,
  getCapitalAccessGuides,
} from "@/lib/resources/access-guides-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("local access guide helpers", () => {
  it("maps capital cities to local access pages when they exist", () => {
    expect(getLocalAccessHrefForCity("Sydney")).toBe("/access/sydney");
    expect(getLocalAccessHrefForCity("Melbourne")).toBe("/access/melbourne");
    expect(getLocalAccessHrefForCity("Canberra")).toBeUndefined();
  });

  it("labels guide status exhaustively", () => {
    const sydney = getAccessGuideBySlug("nsw", "sydney-accessibility-guide");
    expect(sydney).toBeDefined();
    if (!sydney) return;
    expect(accessGuideStatusLabel(sydney)).toBe("Starter guide drafted");
  });

  it("lists Australian states and territories from guide data", () => {
    expect(getAccessGuideStates()).toEqual(
      expect.arrayContaining(["ACT", "NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT"]),
    );
  });
});

describe("LocalAccessGuidesDirectory", () => {
  it("renders the public destination heading, capitals, and PDF download", () => {
    render(
      <LocalAccessGuidesDirectory
        guides={accessGuides}
        capitalGuides={getCapitalAccessGuides()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Accessibility guides for cities and towns across Australia/i,
      }),
    ).toBeTruthy();
    expect(screen.getByText("Local Access Guides")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Capital Access Guides" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Download guides pack \(PDF\)/i })
        .getAttribute("href"),
    ).toBe(accessGuideDownloads.pdf);
    expect(
      screen
        .getByRole("link", { name: "Open Sydney guide" })
        .getAttribute("href"),
    ).toBe("/guides/nsw/sydney-accessibility-guide");
    expect(
      screen
        .getAllByRole("link", { name: "Local access page" })[0]
        ?.getAttribute("href"),
    ).toBe("/access/sydney");
  });

  it("filters guides by search without requiring authentication", () => {
    render(
      <LocalAccessGuidesDirectory
        guides={accessGuides}
        capitalGuides={getCapitalAccessGuides()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Search city or region"), {
      target: { value: "Wollongong" },
    });

    expect(
      screen.getByRole("heading", { name: "Matching Local Access Guides" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Open Wollongong guide" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Capital Access Guides" })).toBeNull();
    expect(screen.getByText(/Showing 1 guide/)).toBeTruthy();
  });

  it("does not render form elements (informational boundary contract)", () => {
    const { container } = render(
      <LocalAccessGuidesDirectory
        guides={accessGuides}
        capitalGuides={getCapitalAccessGuides()}
      />,
    );

    expect(container.querySelectorAll("form")).toHaveLength(0);
    expect(screen.getByRole("search", { name: "Guide filters" })).toBeTruthy();
  });
});

describe("guides public page contract", () => {
  it("does not wrap /guides in PublicInfoPage or auth guards", () => {
    const pagePath = join(process.cwd(), "app/(marketing)/guides/page.tsx");
    expect(existsSync(pagePath)).toBe(true);
    const source = readFileSync(pagePath, "utf8");
    expect(source).toContain("LocalAccessGuidesDirectory");
    expect(source).not.toContain("PublicInfoPage");
    expect(source).not.toContain("requireAuth");
    expect(source).not.toContain("requirePermission");
  });

  it("surfaces Local Access Guides in footer resource links", () => {
    expect(
      footerResourceLinks.some(
        (link) => link.href === "/guides" && link.label === "Local Access Guides",
      ),
    ).toBe(true);

    render(<MapAbleCareMarketingFooter />);
    expect(
      screen
        .getByRole("link", { name: "Local Access Guides" })
        .getAttribute("href"),
    ).toBe("/guides");
  });
});
