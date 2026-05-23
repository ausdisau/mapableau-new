import type { TransportBookingStatus } from "@prisma/client";

export type { TransportBookingStatus };

export const TRANSPORT_STATUS_LABELS: Record<TransportBookingStatus, string> = {
  draft: "Draft",
  quote_requested: "Quote requested",
  quoted: "Quoted",
  participant_confirmed: "Confirmed by you",
  provider_accepted: "Accepted by provider",
  driver_assigned: "Driver assigned",
  vehicle_dispatched: "Vehicle on the way",
  arrived_at_pickup: "Arrived at pickup",
  passenger_onboard: "Passenger on board",
  arrived_at_destination: "Arrived at destination",
  completed: "Trip completed",
  invoiced: "Invoiced",
  paid: "Paid",
  cancelled: "Cancelled",
  late_risk: "May be late",
  no_show: "No show",
  access_issue: "Access issue",
  incident_reported: "Incident reported",
  disputed: "Disputed",
};

export interface AccessNeedsInput {
  boardingAssistance?: boolean;
  transferAssistance?: boolean;
  sensoryConsiderations?: string;
  maxTimeInVehicleMinutes?: number;
  hoistRequired?: boolean;
  notes?: string;
}

export interface MobilityAidSnapshot {
  wheelchair?: boolean;
  powerWheelchair?: boolean;
  walker?: boolean;
  other?: string;
}

export interface VehicleRequirementsInput {
  requiresWheelchairAccessible?: boolean;
  requiresRamp?: boolean;
  requiresLift?: boolean;
  assistanceAnimal?: boolean;
  seatedCapacityMin?: number;
}

export interface CommunicationPreferencesInput {
  preferredMethod?: "phone" | "sms" | "email" | "in_app";
  plainLanguage?: boolean;
  noUnexpectedCalls?: boolean;
  notes?: string;
}

export interface FareBreakdown {
  baseCents: number;
  distanceCents: number;
  accessibilitySurchargeCents?: number;
  currency: string;
  totalCents: number;
}

export interface RouteSummaryPublic {
  distanceKm: number;
  durationMinutes: number;
  provider: string;
}

export interface DispatchRecommendation {
  driverProfileId: string;
  vehicleId: string;
  driverName: string;
  vehicleName: string;
  score: number;
  warnings: string[];
  estimatedPickupMinutes: number;
}
