import type { BookingStatus, TransportBookingStatus } from "@prisma/client";

export type TransportBookingSummary = {
  id: string;
  bookingId: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  status: TransportBookingStatus;
  bookingStatus?: BookingStatus;
};

export type RoutePoint = {
  lat: number;
  lng: number;
};

export const TRANSPORT_STATUS_LABELS: Record<TransportBookingStatus, string> = {
  draft: "Draft",
  requested: "Requested",
  awaiting_operator_response: "Awaiting operator response",
  operator_accepted: "Operator accepted",
  driver_assigned: "Driver assigned",
  vehicle_assigned: "Vehicle assigned",
  confirmed: "Confirmed",
  driver_en_route: "Driver en route",
  arrived_for_pickup: "Arrived for pickup",
  participant_on_board: "Participant on board",
  in_transit: "In transit",
  arrived_at_destination: "Arrived at destination",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};
