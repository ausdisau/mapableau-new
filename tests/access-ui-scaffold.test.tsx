/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccessUIScaffold } from "@/components/access/AccessUIScaffold";
import { DEFAULT_ACCESS_REQUIREMENT_PROFILE } from "@/lib/access/experience/types";
import { calculateAccessFitV2 } from "@/lib/access/fit/calculate-access-fit-v2";
import { ACCESS_UI_SCAFFOLD_PLACES } from "@/lib/demo/access-ui-scaffold";

const darwinBoundary = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [130.6, -12.7],
            [131.1, -12.7],
            [131.1, -12.2],
            [130.6, -12.2],
            [130.6, -12.7],
          ],
        ],
      },
      properties: {
        mapableSlug: "darwin",
        gccsaCode: "7GDAR",
        gccsaName: "Greater Darwin",
        stateName: "Northern Territory",
        areaSqKm: null,
        source: "abs_asgs_2026",
      },
    },
  ],
};

describe("AccessUIScaffold", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          boundary: darwinBoundary,
          source: {
            custodian: "Australian Bureau of Statistics",
            dataset: "ASGS Edition 4 Greater Capital City Statistical Areas",
            referenceYear: 2026,
            licence: "CC BY 4.0",
            serviceUrl: "https://example.invalid/abs",
            referenceUrl: "https://example.invalid/abs-reference",
          },
          status: {
            expectedRegions: 8,
            receivedRegions: 1,
            complete: false,
          },
        }),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the canonical Access shell and labels fixture data honestly", async () => {
    render(<AccessUIScaffold />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /find places that fit how you move, communicate and participate/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: /canonical mapable access shell, fixture-backed/i,
      }),
    ).toBeTruthy();
    expect(screen.getByText(/synthetic fixture data/i)).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /my access requirements/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /data sources and confidence/i }),
    ).toBeTruthy();

    await waitFor(() =>
      expect(screen.getByText(/abs boundary partially loaded/i)).toBeTruthy(),
    );
  });

  it("uses canonical GCCSA filtering and disables live actions for fixtures", async () => {
    const user = userEvent.setup();
    render(<AccessUIScaffold />);

    await waitFor(() =>
      expect(screen.getByText(/abs boundary partially loaded/i)).toBeTruthy(),
    );

    await user.click(screen.getByRole("button", { name: /^darwin/i }));

    expect(
      screen.getByText("Darwin Waterfront Pavilion — scaffold"),
    ).toBeTruthy();
    expect(screen.getByText(/^1 result$/i)).toBeTruthy();

    await user.click(
      screen.getByRole("button", {
        name: "Darwin Waterfront Pavilion — scaffold",
      }),
    );

    expect(
      screen.getByText(
        /scaffold fixture — live place, reporting and route actions are disabled/i,
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: /view details/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /plan route/i })).toBeNull();
  });

  it("preserves UNKNOWN through the repository's AccessFit V2 engine", () => {
    const darwin = ACCESS_UI_SCAFFOLD_PLACES.find(
      (place) => place.accessPlaceId === "scaffold-darwin-pavilion",
    );
    expect(darwin).toBeTruthy();

    const fit = calculateAccessFitV2(
      {
        ...DEFAULT_ACCESS_REQUIREMENT_PROFILE,
        stepFreeRequired: true,
        accessibleToiletRequired: true,
      },
      darwin!.placeProfile,
    );

    expect(fit.metCount).toBe(0);
    expect(fit.unmetCount).toBe(0);
    expect(fit.unknownCount).toBe(2);
  });
});
