import {
  mapableEyebrowBadgeClass,
  mapableEyebrowBadgeSecondaryClass,
} from "@/lib/brand/styles";

/** Semantic status surfaces aligned with MapAble brand tokens. */
export const mapableStatusNeutralClass =
  "border-border/60 bg-muted/50 text-muted-foreground";

export const mapableStatusInfoClass = mapableEyebrowBadgeClass;

export const mapableStatusSuccessClass = mapableEyebrowBadgeSecondaryClass;

export const mapableStatusWarningClass =
  "border-primary/25 bg-primary/5 font-semibold text-primary";

export const mapableStatusDangerClass =
  "border-destructive/30 bg-destructive/10 font-semibold text-destructive";

export type MapableStatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export const MAPABLE_STATUS_TONE_CLASS: Record<MapableStatusTone, string> = {
  neutral: mapableStatusNeutralClass,
  info: mapableStatusInfoClass,
  success: mapableStatusSuccessClass,
  warning: mapableStatusWarningClass,
  danger: mapableStatusDangerClass,
};

/** Domain status keys mapped to semantic tones for consistent badges app-wide. */
export const MAPABLE_STATUS_TONE_BY_KEY: Record<string, MapableStatusTone> = {
  draft: "neutral",
  requested: "info",
  awaiting_provider_acceptance: "warning",
  confirmed: "success",
  in_progress: "info",
  completed: "success",
  cancelled: "neutral",
  disputed: "danger",
  active: "success",
  revoked: "danger",
  expired: "neutral",
  pending: "warning",
  verified: "success",
  not_started: "neutral",
  pending_review: "warning",
  rejected: "danger",
  suspended: "danger",
  paid: "success",
  pending_payment: "warning",
  issued: "info",
  exported: "success",
  failed: "danger",
  refunded: "neutral",
  provider_review: "warning",
  accepted: "success",
  dispatch_pending: "warning",
  driver_vehicle_assigned: "info",
  driver_accepted: "success",
  pre_start_check_required: "warning",
  en_route_to_pickup: "info",
  arrived_at_pickup: "info",
  participant_boarded: "info",
  en_route_to_dropoff: "info",
  arrived_at_dropoff: "info",
  handover_completed: "success",
  trip_completed: "success",
  evidence_submitted: "info",
  participant_review: "warning",
  closed: "neutral",
  declined: "danger",
  driver_no_show: "danger",
  participant_no_show: "danger",
  handover_failed: "danger",
  unsafe_to_continue: "danger",
  service_recovery_required: "warning",
  submitted: "info",
  awaiting_admin_review: "warning",
  awaiting_provider_response: "warning",
  scheduled: "info",
  approved: "success",
  published: "success",
};

export function mapableStatusToneForKey(status: string): MapableStatusTone {
  return MAPABLE_STATUS_TONE_BY_KEY[status] ?? "neutral";
}

export function mapableStatusClassForKey(status: string): string {
  return MAPABLE_STATUS_TONE_CLASS[mapableStatusToneForKey(status)];
}
