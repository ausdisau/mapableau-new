import type {
  TherapyAppointmentStatus,
  TherapyDeliveryMode,
  TherapyType,
} from "@prisma/client";

export const THERAPY_TYPE_LABELS: Record<TherapyType, string> = {
  physiotherapy: "Physiotherapy",
  occupational_therapy: "Occupational therapy",
  speech_pathology: "Speech pathology",
  exercise_physiology: "Exercise physiology",
  psychology: "Psychology",
  other: "Allied health",
};

export const DELIVERY_MODE_LABELS: Record<TherapyDeliveryMode, string> = {
  telehealth: "Video appointment",
  home_visit: "Home visit",
  clinic: "Clinic visit",
};

export const APPOINTMENT_STATUS_LABELS: Record<TherapyAppointmentStatus, string> = {
  draft: "Draft",
  requested: "Requested",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "Did not attend",
};

export type TherapistSearchResult = {
  id: string;
  displayName: string;
  profileSummary: string | null;
  therapyTypes: TherapyType[];
  telehealthEnabled: boolean;
  homeVisitEnabled: boolean;
  verified: boolean;
};
