import type {
  RequestBlocker,
  RequestProgress,
  RequestProgressStatus,
} from "@/types/wedges";

const STATUS_ORDER: RequestProgressStatus[] = [
  "request_created",
  "shortlist_ready",
  "waiting_for_provider",
  "provider_responded",
  "appointment_booked",
  "transport_arranged",
  "completed",
  "follow_up_needed",
  "stalled",
];

export function requestProgressStatusLabel(status: RequestProgressStatus): string {
  switch (status) {
    case "request_created":
      return "Request created";
    case "shortlist_ready":
      return "Shortlist ready";
    case "waiting_for_provider":
      return "Waiting for provider";
    case "provider_responded":
      return "Provider responded";
    case "appointment_booked":
      return "Appointment booked";
    case "transport_arranged":
      return "Transport arranged";
    case "completed":
      return "Completed";
    case "follow_up_needed":
      return "Follow-up needed";
    case "stalled":
      return "Stalled";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function requestBlockerLabel(blocker: RequestBlocker): string {
  switch (blocker) {
    case "no_provider_response":
      return "No provider response";
    case "no_availability":
      return "No availability";
    case "transport_barrier":
      return "Transport barrier";
    case "access_barrier":
      return "Access barrier";
    case "funding_uncertainty":
      return "Funding or payment uncertainty";
    case "participant_changed_preference":
      return "Participant changed preference";
    case "other":
      return "Other";
    default: {
      const _exhaustive: never = blocker;
      return _exhaustive;
    }
  }
}

export type TimelineStep = {
  key: RequestProgressStatus;
  label: string;
  completed: boolean;
  current: boolean;
  timestamp: string | null;
};

/**
 * Derive timeline steps from request progress record.
 */
export function buildRequestTimeline(progress: RequestProgress): TimelineStep[] {
  const timestamps: Partial<Record<RequestProgressStatus, string | null>> = {
    request_created: progress.requestSubmittedAt,
    shortlist_ready: progress.providerShortlistedAt,
    waiting_for_provider: progress.providerContactedAt,
    provider_responded: progress.providerRespondedAt,
    appointment_booked: progress.appointmentBookedAt,
    transport_arranged: progress.transportBookedAt,
    completed: progress.appointmentCompletedAt,
  };

  const currentIdx = STATUS_ORDER.indexOf(progress.status);

  return STATUS_ORDER.filter((s) => s !== "follow_up_needed" && s !== "stalled").map(
    (key, idx) => ({
      key,
      label: requestProgressStatusLabel(key),
      completed: idx < currentIdx || progress.status === "completed",
      current: key === progress.status,
      timestamp: timestamps[key] ?? null,
    }),
  );
}

export function deriveRequestStatus(progress: RequestProgress): RequestProgressStatus {
  if (progress.followUpNeeded && progress.status !== "completed") {
    return "follow_up_needed";
  }
  if (progress.blockers.length > 0 && !progress.providerRespondedAt) {
    return "stalled";
  }
  return progress.status;
}
