/**
 * @vitest-environment jsdom
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { TourCard } from "@/components/tours/TourCard";
import {
  TourFilterBar,
  type TourFiltersState,
} from "@/components/tours/TourFilterBar";
import { TourListView } from "@/components/tours/TourListView";
import { VerificationBadge } from "@/components/tours/VerificationBadge";
import {
  filterTours,
  getFeaturedTours,
  getTourBySlug,
  getTourCategories,
  TOUR_DISCLAIMER,
  tours,
} from "@/lib/resources/tours-data";

describe("tours data", () => {
  it("includes the sensory-friendly Canberra half-day tour", () => {
    expect(tours.length).toBeGreaterThanOrEqual(1);
    const tour = getTourBySlug("sensory-friendly-canberra-half-day");
    expect(tour?.title).toBe("Sensory-Friendly Canberra Half-Day");
    expect(tour?.featured).toBe(true);
    expect(tour?.stops).toHaveLength(2);
    expect(tour?.transportNotes.some((note) => /no direct public/i.test(note))).toBe(
      true,
    );
    expect(tour?.disclaimer).toBe(TOUR_DISCLAIMER);
    expect(tour?.geojson.type).toBe("FeatureCollection");
  });

  it("filters tours by city, category and access profile", () => {
    expect(filterTours({ city: "Canberra" }).length).toBeGreaterThan(0);
    expect(filterTours({ category: "sensory-friendly" }).length).toBeGreaterThan(0);
    expect(
      filterTours({ accessProfile: "wheelchair", query: "museum" }).length,
    ).toBeGreaterThan(0);
    expect(filterTours({ city: "Nowhere" })).toHaveLength(0);
    expect(getFeaturedTours().length).toBeGreaterThan(0);
    expect(getTourCategories()).toContain("sensory-friendly");
  });
});

describe("tour components", () => {
  it("renders tour cards with accessible links", () => {
    const tour = getTourBySlug("sensory-friendly-canberra-half-day");
    expect(tour).toBeTruthy();
    render(<TourCard tour={tour!} />);
    const link = screen.getByRole("link", {
      name: /Sensory-Friendly Canberra Half-Day/i,
    });
    expect(link.getAttribute("href")).toBe(
      "/resources/tours/sensory-friendly-canberra-half-day",
    );
  });

  it("renders filter buttons with pressed state", () => {
    const filters: TourFiltersState = {
      query: "",
      city: "Canberra",
      category: null,
      accessProfile: null,
    };
    const onChange = (next: TourFiltersState) => {
      Object.assign(filters, next);
    };
    render(
      <TourFilterBar
        filters={filters}
        cities={["Canberra"]}
        categories={["sensory-friendly"]}
        accessProfiles={["wheelchair"]}
        onChange={onChange}
        resultCount={1}
      />,
    );
    const canberra = screen.getByRole("button", { name: "Canberra" });
    expect(canberra.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "All cities" }));
  });

  it("renders list-view itinerary with route summary", () => {
    const tour = getTourBySlug("sensory-friendly-canberra-half-day")!;
    render(<TourListView tour={tour} />);
    expect(
      screen.getByRole("heading", { name: "Accessible list-view itinerary" }),
    ).toBeTruthy();
    expect(screen.getByText(tour.routeSummary)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /National Museum of Australia/i }),
    ).toBeTruthy();
  });

  it("renders verification badge with last checked date", () => {
    const tour = getTourBySlug("sensory-friendly-canberra-half-day")!;
    render(<VerificationBadge verification={tour.verification} />);
    expect(screen.getByText("Community draft")).toBeTruthy();
    expect(
      screen.getByText(new RegExp(`Last checked: ${tour.verification.lastChecked}`)),
    ).toBeTruthy();
  });
});

describe("tours page contracts", () => {
  it("publishes tours index and detail pages", () => {
    const indexPath = join(
      process.cwd(),
      "app/(marketing)/resources/tours/page.tsx",
    );
    const detailPath = join(
      process.cwd(),
      "app/(marketing)/resources/tours/[slug]/page.tsx",
    );
    expect(existsSync(indexPath)).toBe(true);
    expect(existsSync(detailPath)).toBe(true);

    const indexSource = readFileSync(indexPath, "utf8");
    expect(indexSource).toContain("Accessible tours for real-world outings");
    expect(indexSource).toContain("Accessible Tours | MapAble");
    expect(indexSource).toContain("ToursExplorer");
    expect(indexSource).toContain("ReportUpdateCTA");

    const detailSource = readFileSync(detailPath, "utf8");
    expect(detailSource).toContain("TourMapAndList");
    expect(detailSource).toContain("#accessible-itinerary");
    expect(detailSource).toContain("Support worker / carer notes");
    expect(detailSource).toContain("disclaimer");
    expect(detailSource).not.toContain("requireAuth");
  });

  it("wires tours into the resources hub", () => {
    const pagePath = join(process.cwd(), "app/(marketing)/resources/page.tsx");
    const source = readFileSync(pagePath, "utf8");
    expect(source).toContain("/resources/tours");
    expect(source).toContain("Accessible Tours");
  });
});
