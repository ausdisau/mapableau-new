import type { AccessPlaceFeatureType } from "@prisma/client";

import type { GaisFeatureType } from "@/lib/gais/contracts/feature-types";

/** Map Access place feature tags to GAIS feature types. */
export function accessPlaceFeatureToGaisType(
  featureType: AccessPlaceFeatureType,
): GaisFeatureType {
  switch (featureType) {
    case "step_free_entry":
    case "accessible_dropoff":
      return "ENTRANCE";
    case "ramp_access":
      return "RAMP";
    case "lift_access":
      return "LIFT";
    case "accessible_toilet":
    case "changing_places":
      return "TOILET";
    case "accessible_parking":
      return "REST_POINT";
    case "wide_doorways":
      return "DOOR";
    case "wide_paths":
      return "PATH";
    case "public_transport_nearby":
      return "TRANSFER_POINT";
    default:
      return "OTHER";
  }
}

export function humanizeGaisFeatureType(type: GaisFeatureType): string {
  const labels: Record<GaisFeatureType, string> = {
    PLACE: "Place",
    ENTRANCE: "Accessible entrance",
    PATH: "Path",
    CROSSING: "Crossing",
    RAMP: "Ramp",
    LIFT: "Lift",
    DOOR: "Door",
    TOILET: "Accessible toilet",
    REST_POINT: "Rest point",
    TRANSFER_POINT: "Transfer point",
    CHARGING_POINT: "Charging point",
    TEMPORARY_BARRIER: "Temporary condition",
    OTHER: "Accessibility feature",
  };
  return labels[type];
}

export function humanizeBarrierType(type: string): string {
  const labels: Record<string, string> = {
    blocked_path: "Temporary obstruction",
    lift_outage: "Lift outage",
    construction: "Construction",
    poor_surface: "Poor surface",
    missing_curb_ramp: "Missing curb ramp",
    narrow_path: "Narrow path",
    unsafe_crossing: "Unsafe crossing",
    other: "Temporary condition",
  };
  return labels[type] ?? "Temporary condition";
}
