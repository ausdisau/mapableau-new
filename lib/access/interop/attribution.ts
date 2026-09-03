/**
 * Attribution registry for public interop responses.
 */

export type AttributionEntry = {
  providerId: string;
  label: string;
  licence?: string;
  url?: string;
};

const REGISTRY: AttributionEntry[] = [
  {
    providerId: "mapable_quests",
    label: "MapAble Access Quests",
    licence: "MapAble community terms",
  },
  {
    providerId: "panoramax",
    label: "Panoramax",
    url: "https://panoramax.org",
  },
  {
    providerId: "project_sidewalk",
    label: "Project Sidewalk",
    url: "https://projectsidewalk.org",
  },
  {
    providerId: "overture",
    label: "Overture Maps",
    url: "https://overturemaps.org",
    licence: "Source-specific (places CDLA/Apache; transportation ODbL)",
  },
  {
    providerId: "open311",
    label: "Open311 civic services",
  },
  {
    providerId: "sensorthings",
    label: "OGC SensorThings API",
  },
  {
    providerId: "sandbox",
    label: "MapAble sandbox fixture",
  },
];

export function getAttribution(providerId: string): AttributionEntry | undefined {
  return REGISTRY.find((e) => e.providerId === providerId);
}

export function listAttributions(): AttributionEntry[] {
  return [...REGISTRY];
}

export function attributionLabelForProvider(providerId: string): string {
  return getAttribution(providerId)?.label ?? providerId;
}
