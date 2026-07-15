import type { AccessLensObservation } from "@/types/accessLens";

/** Demo overlays and list entries for the Access Lens MVP (no real camera). */
export const accessLensMockObservations: AccessLensObservation[] = [
  {
    id: "obs-entrance-18m",
    type: "entrance",
    label: "Accessible entrance",
    distanceLabel: "18m",
    note: "Main step-free entrance facing the street.",
    verificationStatus: "mapable_verified",
    mode: "user",
    listPriority: 1,
  },
  {
    id: "obs-path-left",
    type: "path",
    label: "Step-free route left",
    note: "Follow the left path around the planter bed.",
    verificationStatus: "mapable_reviewed",
    mode: "user",
    listPriority: 2,
  },
  {
    id: "obs-toilet-inside",
    type: "toilet",
    label: "Accessible toilet inside",
    note: "Accessible toilet near reception on the ground floor.",
    verificationStatus: "business_supplied",
    mode: "user",
    listPriority: 3,
  },
  {
    id: "obs-quiet-courtyard",
    type: "quiet-space",
    label: "Quiet area rear courtyard",
    note: "Lower-stimulus outdoor seating behind the café.",
    verificationStatus: "community_reported",
    mode: "sensory",
    listPriority: 4,
  },
  {
    id: "obs-needs-verification",
    type: "ramp",
    label: "Needs local verification",
    note: "Community report of a portable ramp at the side door — confirm on arrival.",
    verificationStatus: "needs_update",
    mode: "user",
    listPriority: 5,
  },
  {
    id: "obs-dropoff",
    type: "dropoff",
    label: "Accessible drop-off point",
    distanceLabel: "12m",
    note: "Kerbside drop-off near the accessible entrance.",
    verificationStatus: "partner_supplied",
    mode: "transport",
    listPriority: 6,
  },
];

export function getSortedAccessLensObservations(
  observations: AccessLensObservation[] = accessLensMockObservations
): AccessLensObservation[] {
  return [...observations].sort(
    (a, b) => (a.listPriority ?? 99) - (b.listPriority ?? 99)
  );
}
