/**
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MapAbleCareCombinedHomepage, {
  mapAbleCareCombinedDesignTests,
} from "@/components/marketing/MapAbleCareCombinedHomepage";
import {
  companyRegistrationDetails,
  homepageHeroCopy,
  homepageHeroCtas,
  homepageSupportJourneySteps,
  supportAreas,
} from "@/lib/marketing/mapable-care-combined-data";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
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
  mockPush.mockClear();
  vi.unstubAllGlobals();
});

describe("mapAbleCareCombinedDesignTests", () => {
  it("exports the full design contract", () => {
    expect(mapAbleCareCombinedDesignTests).toHaveLength(11);
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
    expect(spec?.expectedHeadline).toBe(homepageHeroCopy.headline);
  });

  it("support selector uses user-facing areas instead of agents", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name ===
        "support selector uses user-facing areas instead of agents",
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
        item.name ===
        "footer displays company ABN and NDIS registration number",
    );
    expect(spec?.expectedRegistrationDetails).toEqual(
      companyRegistrationDetails,
    );
  });

  it("typography uses stable accessible brand typography", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name === "typography uses stable accessible brand typography",
    );
    expect(spec?.expectedTypography).toBe(
      "font-heading extra-bold without WavyText",
    );
  });

  it("design includes clearly labelled sponsored partner placements", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name ===
        "design includes clearly labelled sponsored partner placements",
    );
    expect(spec?.expectedSponsoredPlacements).toEqual(["primary", "search"]);
  });

  it("footer monetization uses AdSense advertising unit", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name === "footer monetization uses AdSense advertising unit",
    );
    expect(spec?.expectedFooterMonetization).toBe("adsense.marketing.footer");
  });

  it("hero section is extracted to dedicated component", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name === "hero section is extracted to dedicated component",
    );
    const source = readFileSync(
      join(
        process.cwd(),
        "components/marketing/MapAbleCareCombinedHomepage.tsx",
      ),
      "utf8",
    );
    expect(spec?.expectedDeclaration).toBe("HeroSection");
    expect(source).toContain("<HeroSection />");
    expect(source).not.toContain("WavyText");
  });

  it("splash homepage includes primary marketing sections", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name === "guided landing includes primary homepage sections",
    );
    const source = readFileSync(
      join(
        process.cwd(),
        "components/marketing/MapAbleCareCombinedHomepage.tsx",
      ),
      "utf8",
    );
    expect(spec?.expectedSections).toEqual([
      "HeroSection",
      "EcosystemNavigator",
      "AccessibilityMapProof",
      "ConnectedJourney",
      "CompetitorContrastStrip",
      "AudiencePathways",
      "PreRegistrationSection",
      "ParentBrandTrust",
      "HomepageFinalCta",
      "BoundaryNotice",
    ]);
    for (const section of spec?.expectedSections ?? []) {
      expect(source).toContain(`<${section}`);
    }
    expect(source).not.toContain("HomepageProofStrip");
    expect(source).not.toContain("GuidedSearchPanel");
    expect(source).not.toContain("HomepageExploreStrip");
  });

  it("homepage has single pre-registration panel anchor", () => {
    const spec = mapAbleCareCombinedDesignTests.find(
      (item) =>
        item.name === "homepage has single pre-registration panel anchor",
    );
    expect(spec?.expectedPreRegistrationAnchor).toBe("pre-register");
  });
});

describe("MapAbleCareCombinedHomepage", () => {
  beforeEach(() => {
    render(<MapAbleCareCombinedHomepage />);
  });

  it("renders splash headline without Coming soon progress signals", () => {
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: homepageHeroCopy.headline,
      }),
    ).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const homeLink = screen.getByRole("link", { name: /MapAble home/i });
    expect(homeLink.textContent).toMatch(/Empowering Independence/i);
    expect(screen.getAllByText(/Empowering Independence/i).length).toBeGreaterThan(0);
    expect(homeLink.className).not.toMatch(/rounded-full bg-\[#0C1833\]/);
    expect(
      screen.getByRole("heading", {
        name: /Access, care, transport, and work/i,
      }),
    ).toBeTruthy();
    expect(screen.queryByText("Honest progress signals")).toBeNull();
    expect(screen.queryByText("Coming soon")).toBeNull();
  });

  it("renders the new brand lockup without a tagline pill", () => {
    const homeLink = screen.getByRole("link", { name: /MapAble home/i });
    const tagline = homeLink.querySelector("span");
    expect(tagline?.textContent).toMatch(/Empowering Independence/i);
    expect(tagline?.className).not.toMatch(/rounded-full/);
    expect(tagline?.className).not.toMatch(/bg-\[#0C1833\]/);
  });

  it("uses map-first hero CTA hierarchy", () => {
    expect(homepageHeroCtas[0]).toEqual({
      label: "Explore the accessibility map",
      href: "/accessibility-map",
    });
    expect(
      screen
        .getByRole("link", { name: "Explore the accessibility map" })
        .getAttribute("href"),
    ).toBe("/accessibility-map");
    expect(
      screen.getAllByRole("link", { name: "Pre-register interest" })[0]
        ?.getAttribute("href"),
    ).toBe("#pre-register");
    expect(
      screen.getByRole("link", { name: "How MapAble works" }).getAttribute("href"),
    ).toBe("/about");
  });

  it("renders Access, Care, Transport and Jobs with explicit status", () => {
    expect(screen.getByRole("heading", { name: "Access" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Care" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Transport" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Jobs" })).toBeTruthy();
    expect(screen.getByText("Available now")).toBeTruthy();
    expect(
      screen.getAllByText("Programme information / controlled pilot").length,
    ).toBe(3);
  });

  it("renders a labelled example accessibility record", () => {
    expect(screen.getByText("Example accessibility record")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Harbour Community Centre" }),
    ).toBeTruthy();
  });

  it("renders connected journey steps as a semantic list", () => {
    const journey = screen.getByRole("heading", {
      name: /One journey. Connected support./i,
    }).closest("section");
    expect(journey).toBeTruthy();
    const items = journey?.querySelectorAll("ol > li");
    expect(items?.length).toBe(homepageSupportJourneySteps.length);
    expect(screen.getByRole("heading", { name: "Find a place" })).toBeTruthy();
  });

  it("keeps the decorative journey visual out of the accessible name", () => {
    const visual = document.querySelector("svg[aria-hidden='true']");
    expect(visual).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 1 }).getAttribute("aria-label"),
    ).toBeNull();
  });

  it("renders a footer donate link to Australian Disability", () => {
    const donate = screen.getByRole("link", { name: "Donate" });
    expect(donate.getAttribute("href")).toBe("https://paypal.me/ausdisau");
    expect(donate.getAttribute("target")).toBe("_blank");
    expect(donate.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders pre-registration and marketing proof sections", () => {
    expect(document.getElementById("pre-register")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: /Pre-register for the MapAble pilot/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Accessibility proof/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Help build Australia/i }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Do not paste NDIS plans, medical records or clinical documents/i,
      ),
    ).toBeTruthy();
  });

  it("renders footer contact and registration details", () => {
    expect(screen.getByText("0434 083 624")).toBeTruthy();
    expect(screen.getByText(/55 641 613 541/)).toBeTruthy();
    expect(screen.getByText("To be confirmed")).toBeTruthy();
  });

  it("renders informational final CTA with pre-register anchor", () => {
    expect(
      screen.getByRole("heading", { name: /Help build Australia/i }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("link", { name: "Pre-register interest" }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Verify my venue" })).toBeNull();
  });

  it("does not claim general bookings or NDIS claims", () => {
    expect(screen.queryByText(/automatically assigned/i)).toBeNull();
    expect(screen.queryByText(/best provider/i)).toBeNull();
    expect(
      screen.getAllByText(/not generally available/i).length,
    ).toBeGreaterThan(0);
  });

  it("submits participant pre-registration with consent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: "Thanks — your pre-registration was received.",
        }),
      }),
    );

    fireEvent.change(
      document.getElementById("prereg-name") as HTMLInputElement,
      {
        target: { value: "Alex Taylor" },
      },
    );
    fireEvent.change(
      document.getElementById("prereg-email") as HTMLInputElement,
      {
        target: { value: "alex@example.com" },
      },
    );
    fireEvent.click(
      screen.getByLabelText(
        /MapAble may use my contact details for pilot pre-registration follow-up/i,
      ),
    );
    fireEvent.click(
      screen.getByLabelText(/I confirm I have not pasted NDIS plan documents/i),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Pre-register interest/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/You are on the list/i)).toBeTruthy();
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/pre-register",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
