import type { AccessPlaceFeatureType } from "@prisma/client";

import type { GaisArrivalFeatureKind } from "./types";

/** Arrival-relevant AccessPlaceFeature tags only. */
export const ARRIVAL_FEATURE_TAGS: AccessPlaceFeatureType[] = [
  "step_free_entry",
  "accessible_dropoff",
  "lift_access",
  "ramp_access",
  "accessible_toilet",
  "changing_places",
  "accessible_parking",
  "wide_doorways",
];

export function arrivalKindFromFeatureTag(
  tag: AccessPlaceFeatureType,
): GaisArrivalFeatureKind | null {
  switch (tag) {
    case "step_free_entry":
    case "ramp_access":
    case "wide_doorways":
      return "ENTRANCE";
    case "accessible_dropoff":
      return "DROP_OFF";
    case "lift_access":
      return "LIFT";
    case "accessible_toilet":
    case "changing_places":
      return "TOILET";
    case "accessible_parking":
      return "REST_POINT";
    default:
      return null;
  }
}

export function arrivalFeatureLabel(
  kind: GaisArrivalFeatureKind,
  tag?: string,
): string {
  switch (kind) {
    case "MAIN_ENTRANCE":
      return "Main entrance";
    case "ENTRANCE":
      if (tag === "step_free_entry") return "Accessible entrance";
      if (tag === "ramp_access") return "Ramp access";
      if (tag === "wide_doorways") return "Wide doorways";
      return "Entrance";
    case "DROP_OFF":
      return "Accessible drop-off";
    case "LIFT":
      return "Lift";
    case "TOILET":
      return tag === "changing_places" ? "Changing Places facility" : "Accessible toilet";
    case "REST_POINT":
      return "Accessible parking";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
