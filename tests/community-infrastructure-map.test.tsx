/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CommunityInfrastructureMap from "@/components/accessibility-map/community/CommunityInfrastructureMap";
import type { CommunityInfrastructureFeature } from "@/lib/access/community-infrastructure/types";

// The actual Leaflet package, marker DOM and delegated events run in these tests.
// jsdom does not lay out elements, so give the real map a usable viewport.
beforeEach(() => {
  vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(800);
  vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(440);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const feature: CommunityInfrastructureFeature = {
  type: "Feature",
  id: "osm:node:42",
  geometry: { type: "Point", coordinates: [151.001, -33.814] },
  properties: {
    id: "osm:node:42",
    name: "Synthetic parking",
    area: "parramatta",
    category: "parking",
    facilityKind: "parking_space",
    wheelchair: "unknown",
    geometryRole: "mapped_point",
    routeEndpoint: false,
    accessFacts: [],
    sourceTags: { amenity: "parking_space" },
    source: {
      id: "osm:node:42",
      url: "https://www.openstreetmap.org/node/42",
      licence: "ODbL-1.0",
      licenceUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
      attribution: "© OpenStreetMap contributors",
      retrievedAt: "2026-11-28T01:00:00Z",
      sourceUpdatedAt: null,
      checkedAt: null,
      checkedScope: null,
      osmVersion: 1,
    },
    gaisFeatureId: "osm:node:42",
    gaisFeatureType: "PLACE",
    gaisEvidenceState: "COMMUNITY_REPORTED",
    gaisEvidenceLabel: "Community reported",
    facts: {},
    evidence: [
      { sourceType: "COMMUNITY_REPORTED", sourceLabel: "OpenStreetMap" },
    ],
    knownAttributes: [],
    unknownAttributes: ["Wheelchair access"],
  },
};

const markerLabel = "1. Synthetic parking. Parking. Read access details.";

describe("community map marker activation with real Leaflet", () => {
  it.each([
    { key: "Enter", code: "Enter", keyCode: 13 },
    { key: " ", code: "Space", keyCode: 32 },
  ])(
    "selects a focused marker once with $code and prevents its default action",
    async ({ key, code, keyCode }) => {
      const onSelect = vi.fn();
      render(
        <CommunityInfrastructureMap features={[feature]} onSelect={onSelect} />,
      );
      const marker = await screen.findByRole("button", { name: markerLabel });
      marker.focus();
      expect(document.activeElement).toBe(marker);

      const keyDown = new KeyboardEvent("keydown", {
        key,
        code,
        keyCode,
        bubbles: true,
        cancelable: true,
      });
      fireEvent(marker, keyDown);
      expect(onSelect).toHaveBeenCalledExactlyOnceWith(feature.id);
      expect(keyDown.defaultPrevented).toBe(true);

      // A held key and the rest of the browser key sequence must not select twice.
      fireEvent.keyDown(marker, { key, code, keyCode, repeat: true });
      fireEvent.keyPress(marker, { key, code, keyCode, charCode: keyCode });
      fireEvent.keyUp(marker, { key, code, keyCode });
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(marker.getAttribute("aria-label")).toBe(markerLabel);
    },
  );

  it("keeps mouse activation, leaves Tab alone and removes map handlers on unmount", async () => {
    const onSelect = vi.fn();
    const { unmount } = render(
      <CommunityInfrastructureMap features={[feature]} onSelect={onSelect} />,
    );
    const marker = await screen.findByRole("button", { name: markerLabel });
    const tab = new KeyboardEvent("keydown", {
      key: "Tab",
      code: "Tab",
      bubbles: true,
      cancelable: true,
    });
    fireEvent(marker, tab);
    expect(tab.defaultPrevented).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(marker);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(feature.id);

    unmount();
    fireEvent.keyDown(marker, { key: "Enter", code: "Enter" });
    fireEvent.click(marker);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
