import type {
  MapAbleMissionWatch,
  MissionWatchType,
  ParticipantWatchAction,
  WatchAlertBucket,
  WatchSeverity,
} from "./types";

export const MISSION_WATCH_FEATURE_FLAG = "MAPABLE_MISSION_WATCH_ENABLED";

const OPTIONAL_BY_DEFAULT: MissionWatchType[] = [
  "participant_requested_reminder",
  "departure_readiness",
];

const CRITICAL_TYPES: MissionWatchType[] = [
  "deadline",
  "approval_expiry",
  "dependency_health",
];

export function defaultSeverityForType(type: MissionWatchType): WatchSeverity {
  switch (type) {
    case "deadline":
    case "approval_expiry":
      return "urgent";
    case "dependency_health":
    case "service_confirmation":
    case "evidence_freshness":
    case "departure_readiness":
    case "human_review_wait":
      return "attention";
    case "participant_requested_reminder":
      return "info";
    default: {
      const _never: never = type;
      return _never;
    }
  }
}

export function defaultBucketForType(type: MissionWatchType): WatchAlertBucket {
  switch (type) {
    case "deadline":
    case "departure_readiness":
    case "approval_expiry":
    case "participant_requested_reminder":
      return "upcoming";
    case "evidence_freshness":
    case "dependency_health":
    case "service_confirmation":
      return "needs_attention";
    case "human_review_wait":
      return "waiting_on";
    default: {
      const _never: never = type;
      return _never;
    }
  }
}

export function defaultParticipantActions(
  watch: Pick<MapAbleMissionWatch, "optional" | "watchType" | "severity">,
): ParticipantWatchAction[] {
  const actions: ParticipantWatchAction[] = [
    "take_no_action",
    "reassess_now",
    "open_evidence",
    "request_human_help",
  ];
  if (watch.severity !== "critical") {
    actions.unshift("snooze");
  }
  if (watch.optional || OPTIONAL_BY_DEFAULT.includes(watch.watchType)) {
    actions.push("disable_optional");
  }
  return [...new Set(actions)];
}

export function isOptionalWatchType(
  type: MissionWatchType,
  explicit?: boolean,
): boolean {
  if (explicit !== undefined) return explicit;
  return OPTIONAL_BY_DEFAULT.includes(type);
}

export function isCriticalWatchType(type: MissionWatchType): boolean {
  return CRITICAL_TYPES.includes(type);
}

export function watchTypeLabel(type: MissionWatchType): string {
  switch (type) {
    case "deadline":
      return "Upcoming deadline";
    case "departure_readiness":
      return "Departure readiness";
    case "service_confirmation":
      return "Service confirmation";
    case "approval_expiry":
      return "Approval expiry";
    case "evidence_freshness":
      return "Evidence freshness";
    case "dependency_health":
      return "Dependency health";
    case "human_review_wait":
      return "Waiting on human review";
    case "participant_requested_reminder":
      return "Your reminder";
    default: {
      const _never: never = type;
      return _never;
    }
  }
}
