/**
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MapAbleCareCombinedHomepage, {
  mapAbleCareCombinedDesignTests,
} from "@/components/marketing/MapAbleCareCombinedHomepage";
import {
  companyRegistrationDetails,
  supportAreas,
} from "@/lib/marketing/mapable-care-combined-data";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
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
  mockPush.mockClear();
});

describe("mapAbleCareCombinedDesignTests", () => {
  it("exports the full design contract", () => {
    expect(mapAbleCareCombinedDesignTests).toHaveLength(10);
  });

  it("search field starts blank", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "search field starts blank",
    );
    expect(spec?.expectedInitialQuery).toBe("");
  });

  it("positioning uses combined care language", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "positioning uses combined care language",
    );
    expect(spec?.expectedHeadline).toBe("Care and support, connected.");
  });

  it("support selector uses user-facing areas instead of agents", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "support selector uses user-facing areas instead of agents",
    );
    expect(spec?.expectedAreas).toEqual(supportAreas);
  });

  it("footer displays current phone number", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "footer displays current phone number",
    );
    expect(spec?.expectedPhone).toBe("0434 083 624");
  });

  it("footer displays company ABN and NDIS registration number", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name === "footer displays company ABN and NDIS registration number",
    );
    expect(spec?.expectedRegistrationDetails).toEqual(companyRegistrationDetails);
  });

  it("typography uses static wavy display treatment without animation", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name === "typography uses static wavy display treatment without animation",
    );
    expect(spec?.expectedTypography).toBe("mapable-display + static WavyText");
  });

  it("wavy typography keeps clear spacing between words", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "wavy typography keeps clear spacing between words",
    );
    expect(spec?.expectedWordSpacing).toBe("0.34em");
  });

  it("design includes clearly labelled sponsored partner placements", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name === "design includes clearly labelled sponsored partner placements",
    );
    expect(spec?.expectedSponsoredPlacements).toEqual(["primary", "search", "footer"]);
  });

  it("hero component is declared with valid function syntax", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) => item.name === "hero component is declared with valid function syntax",
    );
    const source = readFileSync(
      join(process.cwd(), "components/marketing/MapAbleCareCombinedHomepage.tsx"),
      "utf8",
    );
    expect(spec?.expectedDeclaration).toBe("function Hero()");
    expect(source).toContain("function Hero()");
  });

  it("competitive redesign includes trust metrics and guided journey sections", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name ===
        "competitive redesign includes trust metrics and guided journey sections",
    );
    expect(spec?.expectedSections).toEqual([
      "TrustMetrics",
      "JourneyBuilder",
      "MapAbleDifference",
      "MarketplaceGrid",
    ]);
  });
});

describe("MapAbleCareCombinedHomepage", () => {
  beforeEach(() => {
    render(<MapAbleCareCombinedHomepage />);
  });

  it("renders combined care headline and blank search field", () => {
    expect(screen.getByLabelText("Care and support, connected.")).toBeTruthy();
    const search = screen.getByLabelText("Search MapAble") as HTMLInputElement;
    expect(search.value).toBe("");
  });

  it("renders a header donate link to Australian Disability", () => {
    const donate = screen.getByRole("link", { name: "Donate" });
    expect(donate.getAttribute("href")).toBe("https://www.ausdis.au/shop");
    expect(donate.getAttribute("target")).toBe("_blank");
    expect(donate.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders support area selector labels", () => {
    expect(screen.getAllByText("Care").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Transport").length).toBeGreaterThan(0);
    expect(screen.getByText("One journey, not five separate searches.")).toBeTruthy();
    expect(screen.getByLabelText("More than a care marketplace.")).toBeTruthy();
  });

  it("renders footer contact and registration details", () => {
    expect(screen.getByText("0434 083 624")).toBeTruthy();
    expect(screen.getByText(/55 641 613 541/)).toBeTruthy();
    expect(screen.getByText("To be confirmed")).toBeTruthy();
  });

  it("renders sponsored partner labels", () => {
    expect(screen.getAllByText("Sponsored partner").length).toBeGreaterThan(0);
    expect(screen.getByText("Community partners")).toBeTruthy();
  });

  it("navigates to provider finder on search submit", () => {
    const searchInputs = screen.getAllByLabelText("Search MapAble") as HTMLInputElement[];
    fireEvent.change(searchInputs[0], { target: { value: "wheelchair transport" } });
    const forms = document.querySelectorAll("form");
    fireEvent.submit(forms[0]);
    expect(mockPush).toHaveBeenCalledWith("/provider-finder?q=wheelchair+transport");
  });
});
