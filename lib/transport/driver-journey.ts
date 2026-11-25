export const stages = [
  {
    id: "driver_vehicle_assigned",
    label: "Offered",
    next: "Accept assignment",
  },
  { id: "driver_accepted", label: "Accepted", next: "Begin pre-start check" },
  {
    id: "pre_start_check_required",
    label: "Pre-start check",
    next: "Depart for pickup",
  },
  {
    id: "en_route_to_pickup",
    label: "Heading to pickup",
    next: "Confirm arrival at pickup",
  },
  {
    id: "arrived_at_pickup",
    label: "At pickup",
    next: "Confirm rider boarded",
  },
  {
    id: "participant_boarded",
    label: "Rider on board",
    next: "Depart for destination",
  },
  {
    id: "en_route_to_dropoff",
    label: "On trip",
    next: "Confirm arrival at destination",
  },
  {
    id: "arrived_at_dropoff",
    label: "At destination",
    next: "Confirm handover",
  },
  {
    id: "handover_completed",
    label: "Handover complete",
    next: "Complete trip",
  },
  { id: "trip_completed", label: "Completed", next: "" },
] as const;
export const checks = [
  "Vehicle and access equipment checked",
  "Pickup and boarding plan reviewed",
  "Communication arrangements reviewed",
] as const;
