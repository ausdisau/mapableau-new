/** @vitest-environment jsdom */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommunityInfrastructureExplorer } from "@/components/accessibility-map/community/CommunityInfrastructureExplorer";
import {
  communityDateLabel,
  communityTileAttribution,
} from "@/components/accessibility-map/community/presentation";
import type {
  CommunityInfrastructureCollection,
  CommunityInfrastructureFeature,
} from "@/lib/access/community-infrastructure/types";

vi.mock("next/dynamic", () => ({
  default: () =>
    function TestMap({
      features,
      onSelect,
    }: {
      features: CommunityInfrastructureFeature[];
      onSelect: (id: string) => void;
    }) {
      return (
        <div data-testid="optional-map">
          <button type="button" onClick={() => onSelect(features[0].id)}>
            Select first map marker
          </button>
        </div>
      );
    },
}));

const feature: CommunityInfrastructureFeature = {
  type: "Feature",
  id: "osm:way:42",
  geometry: { type: "Point", coordinates: [151.001, -33.814] },
  properties: {
    id: "osm:way:42",
    name: "Synthetic public toilet",
    area: "parramatta",
    category: "toilet",
    facilityKind: "public_toilet",
    wheelchair: "unknown",
    geometryRole: "approximate_bbox_centre",
    routeEndpoint: false,
    accessFacts: [
      { key: "access", label: "Access restriction", value: "customers" },
    ],
    sourceTags: { amenity: "toilets", access: "customers" },
    source: {
      id: "osm:way:42",
      url: "https://www.openstreetmap.org/way/42",
      licence: "ODbL-1.0",
      licenceUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
      attribution: "© OpenStreetMap contributors",
      retrievedAt: "2026-11-28T01:00:00Z",
      sourceUpdatedAt: "2025-06-15T08:30:00Z",
      checkedAt: "2024-04-20",
      checkedScope: "existence only",
      osmVersion: 3,
    },
    gaisFeatureId: "osm:way:42",
    gaisFeatureType: "TOILET",
    gaisEvidenceState: "COMMUNITY_REPORTED",
    gaisEvidenceLabel: "Community reported",
    facts: { access: "customers" },
    evidence: [
      { sourceType: "COMMUNITY_REPORTED", sourceLabel: "OpenStreetMap" },
    ],
    knownAttributes: [{ label: "Access restriction", value: "customers" }],
    unknownAttributes: ["Wheelchair access"],
  },
};

function collection(features = [feature]): CommunityInfrastructureCollection {
  return {
    type: "FeatureCollection",
    features,
    meta: {
      schemaVersion: "1.0.0",
      generatedAt: "2026-11-28T01:00:00Z",
      area: "parramatta",
      areas: [
        {
          id: "parramatta",
          label: "Parramatta centre",
          bbox: [150.99, -33.83, 151.02, -33.8],
        },
      ],
      featureCount: features.length,
      totalMatched: features.length,
      truncated: false,
      dataStatus: "source_snapshot",
      claimState: "source_reported_not_independently_verified",
      evidenceScope: "Synthetic test fixture",
      liveNationalRouting: false,
      notice: "Synthetic source records for testing only.",
      attribution: "© OpenStreetMap contributors",
      sources: [
        {
          id: "openstreetmap",
          url: "https://www.openstreetmap.org",
          licence: "ODbL-1.0",
          licenceUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
        },
      ],
    },
  };
}

function response(value: unknown) {
  return { ok: true, json: async () => value };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("community infrastructure participant interface", () => {
  it("starts with a usable list, preserves unknown access and distinguishes source dates", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(collection())));
    render(<CommunityInfrastructureExplorer />);

    const card = await screen.findByRole("article", {
      name: "Synthetic public toilet",
    });
    expect(screen.queryByTestId("optional-map")).toBeNull();
    expect(
      screen.getByRole("button", { name: "List", pressed: true }),
    ).toBeTruthy();
    expect(within(card).getByText("Unknown — not recorded")).toBeTruthy();
    expect(within(card).getByText("customers")).toBeTruthy();
    expect(within(card).getByText(/Approximate area marker/)).toBeTruthy();
    expect(within(card).getByText("Data retrieved 28 Nov 2026")).toBeTruthy();
    fireEvent.click(within(card).getByText("Missing access details (1)"));
    expect(within(card).getByText("Wheelchair access")).toBeTruthy();
    fireEvent.click(within(card).getByText("Source and evidence dates"));
    expect(within(card).getByText("28 Nov 2026")).toBeTruthy();
    expect(within(card).getByText("15 June 2025")).toBeTruthy();
    expect(within(card).getByText("20 Apr 2024")).toBeTruthy();
    expect(within(card).getByText("existence only")).toBeTruthy();
    expect(
      within(card)
        .getByRole("link", { name: "View this OpenStreetMap record" })
        .getAttribute("href"),
    ).toBe("https://www.openstreetmap.org/way/42");
  });

  it("loads the optional map only on request and focuses the matching list card", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(collection())));
    render(<CommunityInfrastructureExplorer />);
    const card = await screen.findByRole("article", {
      name: "Synthetic public toilet",
    });
    fireEvent.click(screen.getByRole("button", { name: "Map + list" }));
    expect(screen.getByTestId("optional-map")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Select first map marker" }),
    );
    await waitFor(() => expect(document.activeElement).toBe(card));
    expect(
      screen
        .getByRole("list", { name: "Community infrastructure results" })
        .contains(card),
    ).toBe(true);
  });

  it("keeps a loading failure separate from no facilities and allows retry", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(response(collection()));
    vi.stubGlobal("fetch", fetchMock);
    render(<CommunityInfrastructureExplorer />);

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(
      screen.getByText(/This does not mean there are no facilities/),
    ).toBeTruthy();
    expect(screen.queryByText(/No source records match/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("article", { name: "Synthetic public toilet" }),
    ).toBeTruthy();
  });

  it("keeps newer filter results when an older request resolves late", async () => {
    let resolveOld!: (value: unknown) => void;
    const oldRequest = new Promise((resolve) => {
      resolveOld = resolve;
    });
    const newerFeature = {
      ...feature,
      id: "osm:way:43",
      properties: {
        ...feature.properties,
        id: "osm:way:43",
        name: "Synthetic park",
      },
    };
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(oldRequest)
      .mockResolvedValueOnce(response(collection([newerFeature])));
    vi.stubGlobal("fetch", fetchMock);
    render(<CommunityInfrastructureExplorer />);
    fireEvent.change(screen.getByLabelText("Study area"), {
      target: { value: "penrith" },
    });
    expect(
      await screen.findByRole("article", { name: "Synthetic park" }),
    ).toBeTruthy();
    resolveOld(response(collection()));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(
      screen.queryByRole("article", { name: "Synthetic public toilet" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Penrith source records" }),
    ).toBeTruthy();
  });

  it("preserves selected filters in requests and GeoJSON download links", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(collection()));
    vi.stubGlobal("fetch", fetchMock);
    render(<CommunityInfrastructureExplorer />);
    await screen.findByRole("article", { name: "Synthetic public toilet" });
    fireEvent.change(screen.getByLabelText("Type of place"), {
      target: { value: "parking" },
    });
    fireEvent.change(
      screen.getByLabelText("Wheelchair access tag", { selector: "select" }),
      { target: { value: "unknown" } },
    );
    const download = await screen.findByRole("link", {
      name: "Download these records as GeoJSON",
    });
    expect(download.getAttribute("href")).toBe(
      "/api/access/community-infrastructure?area=parramatta&category=parking&wheelchair=unknown&format=geojson",
    );
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(
      "/api/access/community-infrastructure?area=parramatta&category=parking&wheelchair=unknown",
    );
  });

  it("shows unavailable coverage without treating it as zero facilities", async () => {
    const unloaded = collection([]);
    unloaded.meta.dataStatus = "not_loaded";
    unloaded.meta.notice = "This study area has not been imported.";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(unloaded)));
    render(<CommunityInfrastructureExplorer />);
    expect(
      await screen.findByText("Source coverage has not been loaded."),
    ).toBeTruthy();
    expect(screen.queryByText(/No source records match/)).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Download these records as GeoJSON" }),
    ).toBeNull();
  });

  it("renders source-provided strings as text instead of active HTML", async () => {
    const malicious = {
      ...feature,
      properties: {
        ...feature.properties,
        name: '<img src="x" onerror="alert(1)">',
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response(collection([malicious]))),
    );
    render(<CommunityInfrastructureExplorer />);
    const card = await screen.findByRole("article", {
      name: malicious.properties.name,
    });
    expect(card.querySelector('img[src="x"]')).toBeNull();
    expect(card.querySelector("img")?.getAttribute("src")).toBe(
      "/map-symbols/nps/restrooms-black-30.svg",
    );
    expect(card.textContent).toContain(malicious.properties.name);
  });
});

describe("community source date labels", () => {
  it("preserves unknown and invalid dates instead of inventing a check date", () => {
    expect(communityDateLabel(null)).toBe("Not recorded");
    expect(communityDateLabel("not-a-date")).toBe("Not recorded");
    expect(communityDateLabel("2026-11-28")).toBe("28 Nov 2026");
  });

  it("shows timestamp dates in Sydney while retaining source calendar dates", () => {
    expect(communityDateLabel("2026-11-28T20:58:00Z")).toBe("29 Nov 2026");
    expect(communityDateLabel("2026-11-28T13:30:00Z")).toBe("29 Nov 2026");
    expect(communityDateLabel("2026-11-28")).toBe("28 Nov 2026");
    expect(communityDateLabel("2026-02-30")).toBe("Not recorded");
  });
});

describe("community map attribution", () => {
  it("keeps required OSM credit and escapes configured provider text", () => {
    const node = document.createElement("div");
    node.innerHTML = communityTileAttribution(
      'Custom provider & partners <img src=x onerror="alert(1)">',
    );
    expect(node.querySelectorAll("a")).toHaveLength(1);
    expect(node.querySelector("a")?.getAttribute("href")).toBe(
      "https://www.openstreetmap.org/copyright",
    );
    expect(node.querySelector("img")).toBeNull();
    expect(node.textContent).toContain(
      'Custom provider & partners <img src=x onerror="alert(1)">',
    );
    expect(communityTileAttribution("© OpenStreetMap contributors")).toBe(
      communityTileAttribution(),
    );
  });
});
