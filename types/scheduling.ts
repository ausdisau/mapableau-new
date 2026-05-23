import type { ScheduledResourceType, SchedulingEngineType } from "@prisma/client";

export type ResourceKind = ScheduledResourceType;

export type SchedulingRequest = {
  organisationId?: string;
  serviceType: "care" | "transport" | "care_transport";
  requestedStart: string;
  requestedEnd?: string;
  pickupLocationId?: string;
  dropoffLocationId?: string;
  accessibilityRequirements?: Record<string, unknown>;
  participantNotes?: string;
  title?: string;
};

export type SchedulingProblem = {
  bookingId: string;
  organisationId: string;
  windows: { start: Date; end: Date }[];
  resources: {
    type: ResourceKind;
    id: string;
    availableFrom?: Date;
    siteLat?: number;
    siteLng?: number;
  }[];
  pickup?: { lat: number; lng: number };
  dropoff?: { lat: number; lng: number };
};

export type AssignmentProposal = {
  resourceType: ResourceKind;
  resourceId: string;
  startsAt: Date;
  endsAt: Date;
  score: number;
  explanation: string;
};

export type SchedulingProposal = {
  assignments: AssignmentProposal[];
  engine: SchedulingEngineType;
  score: number;
};

export type MatchScore = {
  candidateId: string;
  score: number;
  travelMinutes?: number;
  factors: { name: string; score: number; explanation: string }[];
};

export type ServiceLogDto = {
  id: string;
  bookingId?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  deliveredSupports: unknown[];
  notes?: string | null;
};
