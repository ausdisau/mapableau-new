import type { CoreBookingStatus } from "@/lib/domain/booking-status";
import type { BookingType } from "@/types/mapable";

export type { CoreBookingStatus };

export interface BookingLocationJson {
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
}

export interface AccessibilityRequirementsJson {
  wheelchairAccess?: boolean;
  hoistOrTransfer?: boolean;
  communicationSupport?: boolean;
  sensoryPreferences?: string;
  assistanceAnimal?: boolean;
  otherNotes?: string;
}

export interface DeliveredSupportJson {
  code?: string;
  description: string;
  durationMinutes?: number;
  notes?: string;
}

export interface BookingSummaryDto {
  id: string;
  participantId: string;
  bookingType: BookingType;
  status: CoreBookingStatus;
  title?: string | null;
  description?: string | null;
  requestedStart: string;
  requestedEnd?: string | null;
  assignedOrganisationId?: string | null;
  assignedWorkerId?: string | null;
  estimatedTotalCents?: number | null;
  actualTotalCents?: number | null;
  ndisSupportCategory?: string | null;
  ndisLineItem?: string | null;
  conversationId?: string | null;
}

export interface CreateBookingRequestDto {
  bookingType: BookingType;
  assignedOrganisationId?: string;
  title?: string;
  description?: string;
  requestedStart: string;
  requestedEnd?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  careLocation?: string;
  locationFrom?: BookingLocationJson;
  locationTo?: BookingLocationJson;
  participantNotes?: string;
  accessibilitySummary?: string;
  accessibilityRequirements?: AccessibilityRequirementsJson;
  shareAccessibility?: boolean;
  ndisSupportCategory?: string;
  ndisLineItem?: string;
  estimatedTotalCents?: number;
  preferredCommunicationMethod?: string;
  segments?: Array<{
    segmentType: string;
    startTime?: string;
    endTime?: string;
    pickupAddress?: string;
    dropoffAddress?: string;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
    sortOrder: number;
  }>;
}

export interface CompleteBookingRequestDto {
  actualStartAt: string;
  actualEndAt: string;
  completionNotes?: string;
  deliveredSupports?: DeliveredSupportJson[];
  actualTotalCents?: number;
}

export interface AssignWorkerRequestDto {
  workerUserId: string;
}
