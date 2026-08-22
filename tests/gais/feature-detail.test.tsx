/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GaisFeatureDetail } from "@/components/gais/GaisFeatureDetail";
import type { GaisGeoJsonFeature } from "@/lib/gais/geojson/converters";

const sampleGeoFeature: GaisGeoJsonFeature = {
  type: "Feature",
  id: "gais-place-1",
  geometry: { type: "Point", coordinates: [151.2, -33.87] },
  properties: {
    gaisFeatureId: "gais-place-1",
    gaisFeatureType: "ENTRANCE",
    gaisEvidenceState: "UNKNOWN",
    gaisEvidenceLabel: "Unknown",
    name: "Accessible entrance",
    observedAt: "2026-08-14T00:00:00.000Z",
    facts: {},
    evidence: [],
    knownAttributes: [],
    unknownAttributes: ["Step-free", "Door width"],
  },
};

describe("GaisFeatureDetail", () => {
  it("shows UNKNOWN attributes explicitly", () => {
    render(<GaisFeatureDetail feature={sampleGeoFeature} />);
    expect(screen.getByText(/What we know/i)).toBeTruthy();
    expect(screen.getByText(/Step-free:/)).toBeTruthy();
    expect(screen.getAllByText(/Unknown/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Accessible ✓/i)).toBeNull();
  });

  it("does not claim universal accessibility", () => {
    const { container } = render(<GaisFeatureDetail feature={sampleGeoFeature} />);
    expect(container.textContent).toMatch(/not a universal accessible/i);
    expect(container.textContent).not.toMatch(/Accessible ✓/i);
  });
});
