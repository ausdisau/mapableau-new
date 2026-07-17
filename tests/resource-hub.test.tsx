/**
 * @vitest-environment jsdom
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccessGuidesSection } from "@/components/resources/AccessGuidesSection";
import { FeaturedResourceArticles } from "@/components/resources/FeaturedResourceArticles";
import { PolicyResourceGrid } from "@/components/canvas/PolicyResourceGrid";
import { ResourceModuleGrid } from "@/components/canvas/ResourceModuleGrid";
import {
  getParticipantJourneySteps,
  getResourceTrustPrinciples,
} from "@/lib/canvas/canvas-filters";
import {
  policyResourceLinks,
  resourceModuleLinks,
} from "@/lib/canvas/resource-hub-data";
import {
  accessGuideDownloads,
  accessGuides,
  getAccessGuideBySlug,
  getCapitalAccessGuides,
} from "@/lib/resources/access-guides-data";
import {
  getFeaturedResourceArticles,
  getResourceArticleBySlug,
  resourceArticles,
} from "@/lib/resources/resource-articles-data";

describe("resource hub data", () => {
  it("defines module and policy links for the hub", () => {
    expect(resourceModuleLinks.length).toBeGreaterThanOrEqual(6);
    expect(policyResourceLinks).toHaveLength(4);
    expect(resourceModuleLinks.some((m) => m.href === "/guides")).toBe(true);
    resourceModuleLinks.forEach((module) => {
      expect(module.href).toMatch(/^\//);
      expect(module.label.length).toBeGreaterThan(0);
    });
  });

  it("provides participant journey and trust subsets", () => {
    const participantJourney = getParticipantJourneySteps();
    expect(participantJourney).toHaveLength(8);
    expect(participantJourney[0]?.step).toBe(1);
    expect(participantJourney.at(-1)?.step).toBe(8);

    const trustPrinciples = getResourceTrustPrinciples();
    expect(trustPrinciples).toHaveLength(4);
    expect(trustPrinciples.map((p) => p.title)).toContain("Consent first");
  });
});

describe("access guides data", () => {
  it("includes capital guides and downloadable pack assets", () => {
    expect(accessGuides.length).toBe(61);
    const capitals = getCapitalAccessGuides();
    expect(capitals).toHaveLength(8);
    expect(capitals.map((g) => g.city)).toEqual(
      expect.arrayContaining([
        "Sydney",
        "Melbourne",
        "Brisbane",
        "Canberra",
        "Adelaide",
        "Perth",
        "Hobart",
        "Darwin",
      ]),
    );
    expect(
      getAccessGuideBySlug("nsw", "sydney-accessibility-guide")?.city,
    ).toBe("Sydney");
  });

  it("publishes guide pack files under public/", () => {
    for (const relative of [
      accessGuideDownloads.pdf,
      accessGuideDownloads.docx,
      accessGuideDownloads.rolloutMatrix,
    ]) {
      const pathFromPublic = relative.replace(/^\//, "");
      expect(existsSync(join(process.cwd(), "public", pathFromPublic))).toBe(
        true,
      );
    }
  });
});

describe("resource articles data", () => {
  it("includes the sensory-friendly Canberra itinerary as featured", () => {
    expect(resourceArticles.length).toBeGreaterThanOrEqual(1);
    const featured = getFeaturedResourceArticles();
    expect(featured.some((a) => a.slug === "sensory-friendly-canberra-half-day-itinerary")).toBe(
      true,
    );
    const article = getResourceArticleBySlug(
      "sensory-friendly-canberra-half-day-itinerary",
    );
    expect(article?.href).toBe(
      "/resources/sensory-friendly-canberra-half-day-itinerary",
    );
    expect(article?.featured).toBe(true);
    expect(article?.checklistDownloadHref).toBeTruthy();
  });

  it("publishes the printable checklist under public/", () => {
    const article = getResourceArticleBySlug(
      "sensory-friendly-canberra-half-day-itinerary",
    );
    const relative = article?.checklistDownloadHref?.replace(/^\//, "");
    expect(relative).toBeTruthy();
    expect(existsSync(join(process.cwd(), "public", relative!))).toBe(true);
  });
});

describe("resource hub components", () => {
  it("renders module grid links", () => {
    render(<ResourceModuleGrid modules={resourceModuleLinks.slice(0, 2)} />);
    expect(screen.getByRole("heading", { name: "Explore MapAble modules" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /MapAble Care/i }).getAttribute("href")).toBe(
      "/care",
    );
  });

  it("renders policy resource grid", () => {
    render(<PolicyResourceGrid links={policyResourceLinks} />);
    expect(
      screen.getByRole("heading", { name: "Policy and safety resources" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Privacy notice/i }).getAttribute("href"),
    ).toBe("/privacy");
  });

  it("renders Access Guides section with capital cities and downloads", () => {
    render(
      <AccessGuidesSection
        capitalGuides={getCapitalAccessGuides()}
        regionalCount={53}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Access Guides for Australia" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Download guides pack \(PDF\)/i }).getAttribute(
        "href",
      ),
    ).toBe(accessGuideDownloads.pdf);
    expect(
      screen
        .getByRole("link", { name: /Sydney/i })
        .getAttribute("href"),
    ).toBe("/guides/nsw/sydney-accessibility-guide");
  });

  it("renders featured resource article cards", () => {
    render(
      <FeaturedResourceArticles articles={getFeaturedResourceArticles()} />,
    );
    expect(
      screen.getByRole("heading", { name: "Featured planning resources" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", {
          name: /Sensory-Friendly Canberra Half-Day Itinerary/i,
        })
        .getAttribute("href"),
    ).toBe("/resources/sensory-friendly-canberra-half-day-itinerary");
  });
});

describe("resources page contract", () => {
  it("wires Access Guides and resource hub sections in the page source", () => {
    const pagePath = join(process.cwd(), "app/(marketing)/resources/page.tsx");
    expect(existsSync(pagePath)).toBe(true);
    const source = readFileSync(pagePath, "utf8");
    expect(source).toContain("FeaturedResourceArticles");
    expect(source).toContain("AccessGuidesSection");
    expect(source).toContain("ResourceModuleGrid");
    expect(source).toContain("CanvasBlockGrid");
    expect(source).toContain("Participant support journey");
    expect(source).toContain("PolicyResourceGrid");
    expect(source).toContain("sensory-friendly-canberra-half-day-itinerary");
    expect(source).not.toContain("requireAuth");
  });

  it("publishes the sensory-friendly Canberra itinerary page", () => {
    const itineraryPath = join(
      process.cwd(),
      "app/(marketing)/resources/sensory-friendly-canberra-half-day-itinerary/page.tsx",
    );
    expect(existsSync(itineraryPath)).toBe(true);
    const source = readFileSync(itineraryPath, "utf8");
    expect(source).toContain("Sensory-Friendly Canberra Half-Day Itinerary");
    expect(source).toContain("National Museum of Australia");
    expect(source).toContain("National Arboretum Canberra");
    expect(source).toContain("no direct public");
    expect(source).toContain(
      "Check current opening hours, quiet-hour bookings, transport availability and accessibility details before travelling.",
    );
    expect(source).toContain("not medical, therapy, legal or NDIS advice");
    expect(source).not.toContain("requireAuth");
  });
});
