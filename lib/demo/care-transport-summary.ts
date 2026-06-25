import { CARE_TRANSPORT_PICKUP_BUFFER_MINUTES } from "@/lib/config/y2-orchestration";

export type AccessNeed =
  | "wheelchair_ramp"
  | "power_chair_space"
  | "support_worker_travels"
  | "low_sensory"
  | "assistance_animal"
  | "communication_support";

export type CareSupportType =
  | "personal_care"
  | "community_access"
  | "therapy_support"
  | "work_education_support";

export type CareRequest = {
  supportType: CareSupportType;
  scheduledStart: Date;
  scheduledEnd: Date;
};

export type TripRequest = {
  pickupAddress: string;
  destinationAddress: string;
  scheduledPickup: Date;
};

export type FundingSource = "ndis" | "self_funded" | "other";

export type BookingBundle = {
  care: CareRequest;
  trip: TripRequest;
  accessNeeds: AccessNeed[];
  fundingSource: FundingSource;
  pickupWindowStart: Date;
  pickupWindowEnd: Date;
  bufferMinutes: number;
  claimCategoryPlaceholder: string;
};

export function calculatePickupWindow(
  careStart: Date,
  bufferMinutes: number = CARE_TRANSPORT_PICKUP_BUFFER_MINUTES,
): { pickupWindowStart: Date; pickupWindowEnd: Date; bufferMinutes: number } {
  const pickupWindowEnd = new Date(careStart);
  const pickupWindowStart = new Date(
    careStart.getTime() - bufferMinutes * 60 * 1000,
  );
  return { pickupWindowStart, pickupWindowEnd, bufferMinutes };
}

export function buildBookingBundle(input: {
  care: CareRequest;
  trip: TripRequest;
  accessNeeds: AccessNeed[];
  fundingSource: FundingSource;
}): BookingBundle {
  const window = calculatePickupWindow(input.care.scheduledStart);
  return {
    ...input,
    ...window,
    claimCategoryPlaceholder: "Guidance only — confirm with your plan manager",
  };
}
