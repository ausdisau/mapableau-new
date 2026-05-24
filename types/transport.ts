import type { TransportBookingStatus } from "@prisma/client";

export type TransportBookingSummary = {
  id: string;
  status: TransportBookingStatus;
  pickupAddress: string;
  dropoffAddress: string;
  pickupWindowStart: string;
  bookingId: string | null;
  careRequestId: string | null;
};

export const TRANSPORT_STATUS_LABELS: Record<TransportBookingStatus, string> = {
  draft: "Draft — not sent yet",
  requested: "Requested",
  awaiting_operator_response: "Waiting for operator",
  operator_accepted: "Operator accepted",
  driver_assigned: "Driver assigned",
  vehicle_assigned: "Vehicle assigned",
  confirmed: "Confirmed",
  driver_en_route: "Driver on the way",
  arrived_for_pickup: "Arrived for pickup",
  participant_on_board: "On board",
  in_transit: "In transit",
  arrived_at_destination: "Arrived",
  completed: "Trip completed",
  cancelled: "Cancelled",
  disputed: "Under review",
};

export type NearbyOperatorSummary = {
  organisationId: string;
  name: string;
  distanceKm: number | null;
};
