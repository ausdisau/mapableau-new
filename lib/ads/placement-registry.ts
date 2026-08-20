import type { PlacementCapability, PlacementCode } from "@/lib/ads/types";

export type PlacementDefinition = {
  code: PlacementCode;
  surface: "access" | "provider_finder";
  format: "map_marker" | "map_card" | "bottom_sheet" | "inline" | "sidebar";
  capabilities: PlacementCapability;
};

export const PLACEMENT_REGISTRY: Record<PlacementCode, PlacementDefinition> = {
  "access.map.sponsored-marker": {
    code: "access.map.sponsored-marker",
    surface: "access",
    format: "map_marker",
    capabilities: {
      supportsInternalCreative: true,
      supportsExternalDOMSlot: false,
      supportsMapMarker: true,
      supportsImage: false,
      supportsText: true,
      maxAds: 3,
    },
  },
  "access.map.sponsored-card": {
    code: "access.map.sponsored-card",
    surface: "access",
    format: "map_card",
    capabilities: {
      supportsInternalCreative: true,
      supportsExternalDOMSlot: true,
      supportsMapMarker: false,
      supportsImage: true,
      supportsText: true,
      maxAds: 1,
    },
  },
  "access.map.bottom-sheet": {
    code: "access.map.bottom-sheet",
    surface: "access",
    format: "bottom_sheet",
    capabilities: {
      supportsInternalCreative: true,
      supportsExternalDOMSlot: true,
      supportsMapMarker: false,
      supportsImage: true,
      supportsText: true,
      maxAds: 1,
    },
  },
  "access.results.inline": {
    code: "access.results.inline",
    surface: "access",
    format: "inline",
    capabilities: {
      supportsInternalCreative: true,
      supportsExternalDOMSlot: true,
      supportsMapMarker: false,
      supportsImage: true,
      supportsText: true,
      maxAds: 1,
    },
  },
  "provider-finder.map.sponsored-card": {
    code: "provider-finder.map.sponsored-card",
    surface: "provider_finder",
    format: "map_card",
    capabilities: {
      supportsInternalCreative: true,
      supportsExternalDOMSlot: true,
      supportsMapMarker: false,
      supportsImage: true,
      supportsText: true,
      maxAds: 1,
    },
  },
  "provider-finder.results.inline": {
    code: "provider-finder.results.inline",
    surface: "provider_finder",
    format: "inline",
    capabilities: {
      supportsInternalCreative: true,
      supportsExternalDOMSlot: true,
      supportsMapMarker: false,
      supportsImage: true,
      supportsText: true,
      maxAds: 1,
    },
  },
  "provider-finder.sidebar": {
    code: "provider-finder.sidebar",
    surface: "provider_finder",
    format: "sidebar",
    capabilities: {
      supportsInternalCreative: true,
      supportsExternalDOMSlot: true,
      supportsMapMarker: false,
      supportsImage: true,
      supportsText: true,
      maxAds: 1,
    },
  },
};

export function getPlacement(
  code: string,
): PlacementDefinition | undefined {
  return PLACEMENT_REGISTRY[code as PlacementCode];
}

export function isPlacementCode(value: string): value is PlacementCode {
  return value in PLACEMENT_REGISTRY;
}
