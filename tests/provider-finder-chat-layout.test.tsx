/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProviderFinderClient from "@/app/provider-finder/ProviderFinderClient";

const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    function MockMap() {
      return <div data-testid="mock-map" />;
    }
    return MockMap;
  },
}));

const mockProviders = [
  {
    id: "p1",
    name: "Care Plus",
    slug: "care-plus",
    suburb: "Parramatta",
    state: "NSW",
    postcode: "2150",
    latitude: -33.8,
    longitude: 151.0,
    categories: ["Assistance with Daily Life"],
    supports: [],
    registered: true,
    rating: 4.5,
    reviewCount: 10,
    distanceKm: 2,
  },
];

vi.mock("@/lib/use-provider-outlets", () => ({
  useProviderOutlets: () => ({
    data: [{ id: "o1" }],
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/app/provider-finder/outletToProvider", () => ({
  mapOutletsToProviders: () => mockProviders,
}));

vi.mock("@/lib/hooks/use-proactive-chip-suggestions", () => ({
  useProactiveChipSuggestions: () => ({
    suggestions: ["Support worker near St Ives"],
    loading: false,
  }),
}));

vi.mock("@/components/provider-finder/ProviderFinderHero", () => ({
  ProviderFinderHero: () => <div data-testid="hero" />,
}));

vi.mock("@/components/provider-finder/ProviderFinderSidebar", () => ({
  ProviderFinderSidebar: () => <div data-testid="sidebar" />,
}));

vi.mock("@/components/provider-finder/ProviderFinderAccessLayer", () => ({
  ProviderFinderAccessLayer: () => null,
}));

vi.mock("@/components/provider-finder/ProviderFinderResultCard", () => ({
  ProviderFinderResultCard: () => <div data-testid="result-card" />,
}));

vi.mock("@/lib/provider-finder/fetch-map-pins", () => ({
  fetchProviderMapPins: vi.fn().mockResolvedValue({ providers: [] }),
}));

vi.mock("@/components/provider-finder/ProviderFinderAskPanel", () => ({
  ProviderFinderAskPanel: ({
    onShowResults,
    onInterpretation,
  }: {
    onShowResults?: () => void;
    onInterpretation?: (data: {
      interpretation: {
        parsed: boolean;
        confidence: number;
        filters: { access: string };
        serviceCategorySlug?: string;
        engineId?: string;
      };
      applied: {
        query: string;
        location: string;
        providerName: string;
        serviceQuery: string;
        accessQuery: string;
        supportType: null;
        accessNeedIds: string[];
      };
    }) => void;
  }) => (
    <div data-testid="ask-panel" id="ask-panel">
      <button
        type="button"
        onClick={() =>
          onInterpretation?.({
            interpretation: {
              parsed: true,
              confidence: 0.9,
              filters: { access: "" },
              serviceCategorySlug: "",
              engineId: "test",
            },
            applied: {
              query: "support worker",
              location: "Parramatta",
              providerName: "",
              serviceQuery: "",
              accessQuery: "",
              supportType: null,
              accessNeedIds: [],
            },
          })
        }
      >
        Simulate chat interpretation
      </button>
      <button type="button" onClick={() => onShowResults?.()}>
        View results
      </button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
});

describe("ProviderFinderClient chat layout", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("always renders the ask panel", () => {
    render(<ProviderFinderClient />);
    expect(screen.getByTestId("ask-panel")).toBeTruthy();
    expect(document.getElementById("ask-panel")).toBeTruthy();
  });

  it("shows empty results state before search criteria are applied", () => {
    render(<ProviderFinderClient />);
    expect(screen.getByText("Your results will appear here")).toBeTruthy();
    expect(screen.queryByText(/matched provider/)).toBeNull();
  });

  it("shows results after chat interpretation applies filters", async () => {
    const { fireEvent } = await import("@testing-library/react");
    render(<ProviderFinderClient />);
    fireEvent.click(screen.getByText("Simulate chat interpretation"));
    expect(await screen.findByText(/matched provider/)).toBeTruthy();
    expect(screen.getByTestId("mock-map")).toBeTruthy();
  });

  it("keeps ask panel mounted when results are visible", async () => {
    const { fireEvent } = await import("@testing-library/react");
    render(<ProviderFinderClient />);
    fireEvent.click(screen.getByText("Simulate chat interpretation"));
    await screen.findByText(/matched provider/);
    expect(screen.getByTestId("ask-panel")).toBeTruthy();
  });

  it("hydrates results from URL search params on load", () => {
    mockSearchParams.set("q", "therapy");
    mockSearchParams.set("location", "Newcastle");
    render(<ProviderFinderClient />);
    expect(screen.getByText(/matched provider/)).toBeTruthy();
    expect(screen.getByTestId("ask-panel")).toBeTruthy();
  });
});
