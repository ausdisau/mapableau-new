import type { IndoorPoiView, IndoorRouteView } from "@/lib/access-indoor/types";
import { ACCESSIBLE_INDOOR_POI_TYPES } from "@/lib/access-indoor/types";

export const INDOOR_MAP_LAYER_IDS = {
  floorPlan: "access-indoor-floor-plan",
  pois: "access-indoor-pois",
  route: "access-indoor-route",
} as const;

export function poiToNormalizedPoint(poi: Pick<IndoorPoiView, "xNorm" | "yNorm">) {
  return { x: poi.xNorm, y: poi.yNorm };
}

export function routeSegmentToSvgPath(
  points: Array<{ x: number; y: number }>
): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(4)} ${p.y.toFixed(4)}`)
    .join(" ");
}

export function filterPoisByAccessibility(
  pois: IndoorPoiView[],
  accessibleOnly: boolean
): IndoorPoiView[] {
  if (!accessibleOnly) return pois;
  return pois.filter((poi) => ACCESSIBLE_INDOOR_POI_TYPES.includes(poi.type));
}

export function routePathsForFloor(
  route: IndoorRouteView,
  floorId: string
): Array<{ x: number; y: number }> {
  const segment = route.segments.find((s) => s.floorId === floorId);
  return segment?.path ?? [];
}
