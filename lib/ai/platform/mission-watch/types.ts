/**
 * Proactive Mission Watch types (Prompt 06).
 * Proactivity = notice → reassess → explain → recommend.
 * Never silently execute operational actions.
 */

export const MISSION_WATCH_TYPES = [
  "deadline",
  "departure_readiness",
  "service_confirmation",
  "approval_expiry",
  "evidence_freshness",
  "dependency_health",
  "human_review_wait",
  "participant_requested_reminder",
] as const;

export type MissionWatchType = (typeof MISSION_WATCH_TYPES)[number];

/** Explicitly forbidden — clinical monitoring is out of scope. */
export const FORBIDDEN_WATCH_TYPES = [
  "clinical_monitoring",
  "vital_signs",
  "health_surveillance",
  "medication_adherence",
  "diagnostic_tracking",
] as const;

export type ForbiddenWatchType = (typeof FORBIDDEN_WATCH_TYPES)[number];

export const WATCH_SEVERITIES = ["info", "attention", "urgent", "critical"] as const;
export type WatchSeverity = (typeof WATCH_SEVERITIES)[number];

export const WATCH_ALERT_BUCKETS = [
  "upcoming",
  "needs_attention",
  "waiting_on",
  "recently_changed",
] as const;
export type WatchAlertBucket = (typeof WATCH_ALERT_BUCKETS)[number];

export const PARTICIPANT_WATCH_ACTIONS = [
  "snooze",
  "disable_optional",
  "request_human_help",
  "reassess_now",
  "open_evidence",
  "take_no_action",
] as const;
export type ParticipantWatchAction = (typeof PARTICIPANT_WATCH_ACTIONS)[number];

export type WatchCondition = {
  deadlineIso?: string | null;
  approvalExpiresAt?: string | null;
  evidenceObservedAt?: string | null;
  evidenceMaxAgeMinutes?: number | null;
  transportConfirmed?: boolean | null;
  serviceConfirmed?: boolean | null;
  dependencyNodeIds?: string[];
  dependencyHealthy?: boolean | null;
  humanReviewPending?: boolean | null;
  reminderMessage?: string | null;
  requiredConsentScopes?: string[];
  optional?: boolean;
  bufferMinutes?: number;
  leadTimeMinutes?: number;
  warnBeforeMinutes?: number;
};

export type MapAbleMissionWatch = {
  watchId: string;
  missionId: string;
  watchType: MissionWatchType;
  triggerAt: string | null;
  condition: WatchCondition;
  affectedNodeIds: string[];
  enabled: boolean;
  createdBy: string;
  participantVisible: boolean;
  nextEvaluationAt: string | null;
  expiresAt: string | null;
  featureFlag: string;
  traceId: string;
  timeZone: string;
  severity: WatchSeverity;
  optional: boolean;
  snoozedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  lastFiredFingerprint: string | null;
  lastFiredAt: string | null;
  consentRevoked: boolean;
};

export type WatchEvaluationContext = {
  missionId: string;
  participantId: string;
  actorConsentScopes: string[];
  revokedConsentScopes: string[];
  referenceTime: Date;
  timeZone: string;
  contextHints?: Record<string, unknown>;
  planNodeStatuses?: Record<string, string>;
  evidenceStaleNodeIds?: string[];
  unconfirmedTransportNodeIds?: string[];
  pendingHumanReviewNodeIds?: string[];
};

export type WatchRuleResult = {
  watchId: string;
  missionId: string;
  watchType: MissionWatchType;
  fired: boolean;
  suppressed: boolean;
  suppressReason: string | null;
  severity: WatchSeverity;
  bucket: WatchAlertBucket;
  fingerprint: string;
  explanation: string;
  recommendation: string;
  affectedNodeIds: string[];
  recoveryEventType:
    | "DEADLINE_APPROACHING"
    | "EVIDENCE_STALE"
    | "APPROVAL_EXPIRED"
    | "TRANSPORT_UNAVAILABLE"
    | "PROVIDER_CANCELLED"
    | null;
  participantActions: ParticipantWatchAction[];
  operationalActionCreated: false;
};

export type InAppWatchAlert = {
  alertId: string;
  watchId: string;
  missionId: string;
  watchType: MissionWatchType;
  bucket: WatchAlertBucket;
  severity: WatchSeverity;
  title: string;
  body: string;
  recommendation: string;
  fingerprint: string;
  createdAt: string;
  dismissed: boolean;
  participantActions: ParticipantWatchAction[];
  externalNotificationSent: false;
};

export type MissionWatchTickResult = {
  missionId: string;
  evaluatedAt: string;
  watchesEvaluated: number;
  fired: WatchRuleResult[];
  suppressed: WatchRuleResult[];
  alertsCreated: InAppWatchAlert[];
  recoveryEventsIngested: string[];
  reassessRecommended: boolean;
  operationalActionsCreated: 0;
  aiAssistUsed: boolean;
};

export type MissionWatchPresentation = {
  heading: string;
  summary: string;
  sections: Array<{
    id: WatchAlertBucket;
    title: string;
    body: string;
    items: Array<{
      alertId: string;
      watchId: string;
      title: string;
      body: string;
      recommendation: string;
      severity: WatchSeverity;
      actions: ParticipantWatchAction[];
    }>;
  }>;
};
