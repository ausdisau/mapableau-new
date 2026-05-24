/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mapMock = {
  on: vi.fn((event: string, cb?: () => void) => {
    if (event === "load" && cb) cb();
  }),
  addControl: vi.fn(),
  remove: vi.fn(),
  getLayer: vi.fn(),
  getSource: vi.fn(),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  removeSource: vi.fn(),
  fitBounds: vi.fn(),
  flyTo: vi.fn(),
  getCanvas: vi.fn(() => ({ style: { cursor: "" } })),
  getZoom: vi.fn(() => 10),
  queryRenderedFeatures: vi.fn(() => []),
  off: vi.fn(),
};

vi.mock("maplibre-gl", () => ({
  default: {
    Map: vi.fn(() => mapMock),
    NavigationControl: vi.fn(),
    AttributionControl: vi.fn(),
  },
}));

import { MapLibreMap } from "@/components/map/MapLibreMap";

describe("MapLibreMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without SSR crash", () => {
    render(<MapLibreMap />);
    expect(screen.getByLabelText("Interactive map")).toBeTruthy();
  });

  it("loads maplibre-gl package", async () => {
    const maplibre = await import("maplibre-gl");
    expect(maplibre.default.Map).toBeDefined();
  });
});
