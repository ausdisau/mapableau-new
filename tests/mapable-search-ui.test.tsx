/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapAbleSearchForm } from "@/components/search/MapAbleSearchForm";
import { MapAbleSearchResults } from "@/components/search/MapAbleSearchResults";
import {
  createDefaultSearchSelection,
  deepSearchAvailable,
  evidenceStatusForHit,
  organicResultsIgnoringAds,
  validateSearchQuery,
  withPresentation,
  withTier,
} from "@/lib/search/mapable-search-ui";
import {
  initialPublicGuide,
  reducePublicGuide,
  reviewPublicGuide,
} from "@/lib/search/public-guided-flow";
import type { MapAbleSearchHit } from "@/lib/search/mapable-search-core";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe("MapAble Search UI state", () => {
  it("keeps Quick/Deep unchanged when switching Web and Conversation", () => {
    const base = createDefaultSearchSelection({ tier: "deep" });
    const next = withPresentation(base, "conversation");
    expect(next.tier).toBe("deep");
    expect(next.presentation).toBe("conversation");
  });

  it("keeps Web/Conversation unchanged when switching Quick and Deep", () => {
    const base = createDefaultSearchSelection({ presentation: "conversation" });
    const next = withTier(base, "deep");
    expect(next.presentation).toBe("conversation");
    expect(next.tier).toBe("deep");
  });

  it("validates query length on the client helper", () => {
    const ok = validateSearchQuery("  accessible cafe  ");
    expect(ok.ok).toBe(true);
    expect(ok.query).toBe("accessible cafe");
    const long = validateSearchQuery("x".repeat(200));
    expect(long.ok).toBe(false);
  });

  it("keeps Deep Search spending disabled", () => {
    expect(deepSearchAvailable).toBe(false);
  });

  it("never lets ads alter organic ordering", () => {
    const hits: MapAbleSearchHit[] = [
      {
        id: "a",
        kind: "module",
        vertical: "care",
        title: "Care",
        description: "Care pathway",
        href: "/care",
        provenance: "mapable_navigation",
        sourceLabel: "MapAble",
        registration: "not_independently_verified",
        workerScreening: "not_independently_verified",
        accessFit: "unknown",
        availability: "unknown",
      },
      {
        id: "b",
        kind: "module",
        vertical: "jobs",
        title: "Jobs",
        description: "Jobs pathway",
        href: "/employment",
        provenance: "mapable_navigation",
        sourceLabel: "MapAble",
        registration: "not_independently_verified",
        workerScreening: "not_independently_verified",
        accessFit: "unknown",
        availability: "unknown",
      },
    ];
    const ads = [
      {
        id: "ad-1",
        label: "Advertisement" as const,
        paidForBy: "Example Advertiser",
        href: "/about",
        summary: "Paid placement",
      },
    ];
    expect(organicResultsIgnoringAds(hits, ads).map((h) => h.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("marks provider outlets as unknown evidence", () => {
    const hit: MapAbleSearchHit = {
      id: "ndis-outlet:1",
      kind: "provider_outlet",
      vertical: "providers",
      title: "Synthetic",
      description: "Listing",
      href: "/provider-finder",
      provenance: "local_ndis_directory_import",
      sourceLabel: "import",
      registration: "not_independently_verified",
      workerScreening: "not_independently_verified",
      accessFit: "unknown",
      availability: "unknown",
    };
    expect(evidenceStatusForHit(hit)).toBe("unknown");
  });
});

describe("MapAble Search form radios", () => {
  it("renders independent experience and depth radio groups", () => {
    render(<MapAbleSearchForm />);
    expect(
      screen.getByRole("radiogroup", { name: "Search experience" }),
    ).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "Search depth" })).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Conversation"));
    fireEvent.click(screen.getByLabelText("Deep · Credits"));
    expect(
      (screen.getByLabelText("Conversation") as HTMLInputElement).checked,
    ).toBe(true);
    expect(
      (screen.getByLabelText("Deep · Credits") as HTMLInputElement).checked,
    ).toBe(true);
    expect((screen.getByLabelText("Web") as HTMLInputElement).checked).toBe(
      false,
    );
    expect(
      (screen.getByLabelText("Quick · Free") as HTMLInputElement).checked,
    ).toBe(false);
  });
});

describe("MapAble Search results provenance", () => {
  it("shows unknown access fit and human-help pathways", () => {
    render(
      <MapAbleSearchResults
        status="results"
        response={{
          results: [
            {
              id: "provider-finder",
              kind: "module",
              vertical: "providers",
              title: "Provider Finder",
              description: "Explore providers",
              href: "/provider-finder",
              provenance: "mapable_navigation",
              sourceLabel: "MapAble public module navigation",
              registration: "not_independently_verified",
              workerScreening: "not_independently_verified",
              accessFit: "unknown",
              availability: "unknown",
            },
          ],
          sourceState: "navigation_only",
          providerIndexEnabled: false,
          warnings: ["Listings do not establish current registration."],
          resultCount: 1,
        }}
      />,
    );
    expect(screen.getByText(/Unknown — not assigned/i)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Ask for human help/i }),
    ).toBeTruthy();
  });
});

describe("public guided flow", () => {
  it("reviews to a literal MapAble href without query leakage", () => {
    let state = initialPublicGuide();
    state = reducePublicGuide(state, { type: "choose_goal", goal: "places" });
    state = reducePublicGuide(state, {
      type: "set_location",
      value: "Private suburb with health note",
    });
    state = reducePublicGuide(state, { type: "next" });
    state = reducePublicGuide(state, {
      type: "set_access",
      value: "wheelchair",
    });
    state = reducePublicGuide(state, { type: "next" });
    const review = reviewPublicGuide(state);
    expect(review?.href).toBe("/accessibility-map");
    expect(review?.href.includes("Private")).toBe(false);
    expect(review?.location).toContain("Private suburb");
  });
});
