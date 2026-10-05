/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/access/AccessMap", () => ({
  AccessMap: ({
    places,
  }: {
    places: Array<{ id: string; name: string }>;
  }) => (
    <div role="application" aria-label="Canonical AccessMap test double">
      {places.length} map place{places.length === 1 ? "" : "s"}
    </div>
  ),
}));

import { AccessUIScaffold } from "@/components/access/AccessUIScaffold";

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

  it("uses canonical Access components while labelling fixture data honestly", async () => {
    render(<AccessUIScaffold />);

    expect(
      screen.getByRole("heading", {
        name: /mapable access national discovery scaffold/i,
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

  it("uses canonical GCCSA filtering and the same result IDs for list and map", async () => {
    const user = userEvent.setup();
    render(<AccessUIScaffold />);

    await waitFor(() =>
      expect(screen.getByText(/abs boundary partially loaded/i)).toBeTruthy(),
    );

    await user.click(screen.getByRole("button", { name: /^darwin/i }));

    expect(
      screen.getByText("Darwin Waterfront Pavilion — scaffold"),
    ).toBeTruthy();
    expect(screen.getByText(/1 scaffold result/i)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /^map$/i }));

    expect(
      screen.getByRole("application", {
        name: /canonical accessmap test double/i,
      }),
    ).toHaveTextContent("1 map place");
  });

  it("preserves UNKNOWN through the real AccessFit V2 engine", async () => {
    const user = userEvent.setup();
    render(<AccessUIScaffold />);

    await waitFor(() =>
      expect(screen.getByText(/abs boundary partially loaded/i)).toBeTruthy(),
    );
    await user.click(screen.getByRole("button", { name: /^darwin/i }));

    expect(
      screen.getByRole("heading", {
        name: /access fit for your selected requirements/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(/2 requirements have unknown evidence/i),
    ).toBeTruthy();
  });
});
