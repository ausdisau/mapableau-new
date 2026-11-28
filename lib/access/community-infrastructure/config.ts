import type { CommunityArea, CommunityAreaId } from "./types";

export const COMMUNITY_AREAS: CommunityArea[] = [
  {
    id: "parramatta",
    label: "Parramatta centre",
    bbox: [150.99, -33.83, 151.02, -33.8],
  },
  {
    id: "penrith",
    label: "Penrith centre",
    bbox: [150.68, -33.77, 150.71, -33.74],
  },
  {
    id: "blacktown",
    label: "Blacktown centre",
    bbox: [150.895, -33.78, 150.925, -33.75],
  },
];
export const OSM_ATTRIBUTION = "© OpenStreetMap contributors";
export const OSM_LICENCE_URL = "https://opendatacommons.org/licenses/odbl/1-0/";
export const COMMUNITY_NOTICE =
  "OpenStreetMap source reports, not independently checked by MapAble. Missing details are unknown. These study windows do not show every facility. Map points are not verified entrances or accessible routes; parking vacancy and equipment operation are not live.";
export const MAX_SOURCE_ELEMENTS = 2000;
export const MAX_PUBLIC_FEATURES = 500;

export function getCommunityArea(id: string): CommunityArea | undefined {
  return COMMUNITY_AREAS.find((area) => area.id === id);
}

export function buildCommunityOverpassQuery(id: CommunityAreaId): string {
  const area = getCommunityArea(id);
  if (!area) throw new Error("Unknown study area");
  const [west, south, east, north] = area.bbox;
  return `[out:json][timeout:25][bbox:${south},${west},${north},${east}];
(
  nwr["amenity"="toilets"];
  nwr["toilets"="yes"];
  nwr["amenity"="parking_space"]["parking_space"="disabled"];
  nwr["amenity"="parking"]["capacity:disabled"];
  nwr["amenity"~"^(parking|parking_space)$"]["disabled"~"^(yes|designated)$"];
  nwr["leisure"~"^(park|garden|playground)$"];
  nwr["place"="square"];
);
out meta center ${MAX_SOURCE_ELEMENTS + 1};`;
}
