const TRANSITIONS: Record<string, string[]> = {
  draft: ["requested", "cancelled"],
  requested: ["awaiting_operator_response", "cancelled"],
  awaiting_operator_response: ["operator_accepted", "cancelled"],
  operator_accepted: ["driver_assigned", "cancelled"],
  driver_assigned: ["vehicle_assigned", "confirmed", "cancelled"],
  vehicle_assigned: ["confirmed", "cancelled"],
  confirmed: ["driver_en_route", "cancelled"],
  driver_en_route: ["arrived_for_pickup", "cancelled"],
  arrived_for_pickup: ["participant_on_board", "cancelled"],
  participant_on_board: ["in_transit", "cancelled"],
  in_transit: ["arrived_at_destination", "cancelled"],
  arrived_at_destination: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function assertTransportBookingTransition(from: string, to: string) {
  const allowed = TRANSITIONS[from];
  if (!allowed?.includes(to)) {
    throw new Error(`INVALID_TRANSPORT_TRANSITION:${from}->${to}`);
  }
}
