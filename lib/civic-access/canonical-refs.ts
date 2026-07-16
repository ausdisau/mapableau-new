/**
 * Shared canonical reference vocabulary for Civic ↔ AccessPlace ↔ AccessibilityOps.
 * Civic never duplicates AccessPlace rows; it only references them.
 */

import type { CivicExternalSystem } from "./types";

export function accessPlaceCanonicalRef(accessPlaceId: string): string {
  return `access_place:${accessPlaceId}`;
}

export function accessFloorPlanCanonicalRef(floorPlanId: string): string {
  return `access_floor_plan:${floorPlanId}`;
}

export function indoorFeatureCanonicalRef(
  placeId: string,
  featureId: string
): string {
  return `indoor_feature:${placeId}:${featureId}`;
}

export function transportPickupCanonicalRef(pickupId: string): string {
  return `transport_pickup:${pickupId}`;
}

export function transportDropoffCanonicalRef(dropoffId: string): string {
  return `transport_dropoff:${dropoffId}`;
}

export function accessibilityOpsAssetRef(assetId: string): string {
  return `accessibility_ops_asset:${assetId}`;
}

export function parseCanonicalRef(
  ref: string
): { system: CivicExternalSystem; externalId: string } | null {
  const idx = ref.indexOf(":");
  if (idx <= 0) return null;
  const system = ref.slice(0, idx) as CivicExternalSystem;
  const externalId = ref.slice(idx + 1);
  if (!externalId) return null;
  const allowed: CivicExternalSystem[] = [
    "access_place",
    "access_floor_plan",
    "indoor_feature",
    "transport_pickup",
    "transport_dropoff",
    "transport_vehicle",
    "gtfs_stop",
    "gtfs_pathway",
    "cds_curb_zone",
    "accessibility_ops_asset",
    "council_ams",
    "operator_feed",
    "other",
  ];
  if (!allowed.includes(system)) return null;
  return { system, externalId };
}

/**
 * AccessibilityOps digital/product assets vs Civic public-infrastructure assets.
 * Both may reference the same AccessPlace via access_place:{id}.
 */
export const REGISTRY_BOUNDARY = {
  civicOwns: "public-infrastructure accessibility projection and journey graph",
  accessibilityOpsOwns:
    "digital/product test assets, rule registry, shadow evaluation",
  sharedVocabulary: "access_place:{id}, access_floor_plan:{id}, indoor_feature:...",
  forbid: "parallel editable AccessPlace copies",
} as const;
