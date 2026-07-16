/**
 * Physical Systems error codes (brief §31) and typed error class.
 */

export type PhysicalSystemsErrorCode =
  | "PROHIBITED_ACTION"
  | "DEVICE_OFFLINE"
  | "DEVICE_BUSY"
  | "DEVICE_UNHEALTHY"
  | "EMERGENCY_MODE_ACTIVE"
  | "KILL_SWITCH_ACTIVE"
  | "APPROVAL_REQUIRED"
  | "VENUE_APPROVAL_REQUIRED"
  | "APPROVAL_EXPIRED"
  | "INVALID_TRANSITION"
  | "ACTION_EXPIRED"
  | "ACTION_CANCELLED"
  | "ACTION_NOT_FOUND"
  | "CAPABILITY_DISABLED"
  | "CAPABILITY_NOT_FOUND"
  | "POSTCONDITION_FAILED"
  | "PRECONDITION_FAILED"
  | "ADAPTER_ERROR"
  | "TIMEOUT"
  | "MODE_NOT_ALLOWED"
  | "SHADOW_ONLY"
  | "LIVE_DISABLED"
  | "LOCK_CONTENTION"
  | "FALLBACK_REQUIRED"
  | "OBSERVATION_STALE"
  | "UNKNOWN_DEVICE"
  | "PROPOSAL_TAMPERED"
  | "UNSAFE_STATE"
  | "VALIDATION_ERROR"
  | "UNAUTHORISED"
  | "FORBIDDEN"
  | "EXECUTION_FAILED"
  | "SIMULATOR_ONLY";

const DEFAULT_RECOVERY: Record<PhysicalSystemsErrorCode, string> = {
  PROHIBITED_ACTION:
    "This action type is permanently blocked. Choose a non-prohibited assistance option.",
  DEVICE_OFFLINE:
    "Wait for the device to come back online, or use an alternate route / staff assistance.",
  DEVICE_BUSY:
    "Retry after the current device action completes, or cancel the conflicting action.",
  DEVICE_UNHEALTHY:
    "Report the fault to venue staff and use a fallback plan until health is restored.",
  EMERGENCY_MODE_ACTIVE:
    "Physical actuations are suspended during emergency mode. Follow venue emergency procedures.",
  KILL_SWITCH_ACTIVE:
    "Physical Systems are globally paused. Contact a MapAble operator to clear the kill switch.",
  APPROVAL_REQUIRED:
    "Review the proposal and approve it explicitly before execution can continue.",
  VENUE_APPROVAL_REQUIRED:
    "Ask an authorised venue operator to approve this action.",
  APPROVAL_EXPIRED:
    "Re-propose the action and collect fresh approvals.",
  INVALID_TRANSITION:
    "Reload the action status and follow the allowed state transitions.",
  ACTION_EXPIRED:
    "Create a new proposal; this execution window has expired.",
  ACTION_CANCELLED:
    "The action was cancelled. Propose again if still needed.",
  ACTION_NOT_FOUND:
    "Check the execution id or list recent executions for this visit.",
  CAPABILITY_DISABLED:
    "Use an alternate capability (e.g. western lift while main lift is out).",
  CAPABILITY_NOT_FOUND:
    "Confirm the capability id against the venue capability registry.",
  POSTCONDITION_FAILED:
    "Do not assume success. Verify the physical state and escalate to staff if needed.",
  PRECONDITION_FAILED:
    "Resolve the listed preconditions, then propose the action again.",
  ADAPTER_ERROR:
    "Retry once; if it fails again, use staff assistance and report the adapter fault.",
  TIMEOUT:
    "Treat the outcome as unknown. Re-check device state or request staff help.",
  MODE_NOT_ALLOWED:
    "This operation is not permitted in the current operational mode.",
  SHADOW_ONLY:
    "Shadow mode observes only. Switch to supervised/demo simulation or enable live with approval.",
  LIVE_DISABLED:
    "Live actuation is disabled. Use demo/supervised simulation or enable ACCESS_PHYSICAL_LIVE_ENABLED.",
  LOCK_CONTENTION:
    "Another action holds this device. Wait or cancel the other execution.",
  FALLBACK_REQUIRED:
    "Primary action cannot proceed; follow the attached fallback plan.",
  OBSERVATION_STALE:
    "Refresh environment observations before acting.",
  UNKNOWN_DEVICE:
    "Confirm the device id against the venue twin.",
  PROPOSAL_TAMPERED:
    "Reject and re-create the proposal; do not execute a modified payload.",
  UNSAFE_STATE:
    "Safety kernel blocked this action. Review the decision reasons before retrying.",
  VALIDATION_ERROR:
    "Fix the invalid fields and resubmit.",
  UNAUTHORISED:
    "Sign in with an authorised account.",
  FORBIDDEN:
    "You do not have permission for this physical action.",
  EXECUTION_FAILED:
    "Inspect adapter and postcondition details, then decide whether to retry or fall back.",
  SIMULATOR_ONLY:
    "This capability is simulation-only and cannot run against live hardware.",
};

export class PhysicalSystemsError extends Error {
  readonly code: PhysicalSystemsErrorCode;
  readonly recoveryHint: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: PhysicalSystemsErrorCode,
    message: string,
    recoveryHint?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "PhysicalSystemsError";
    this.code = code;
    this.recoveryHint = recoveryHint ?? DEFAULT_RECOVERY[code];
    this.details = details;
  }

  toPublicJson() {
    return {
      error: this.message,
      code: this.code,
      recoveryHint: this.recoveryHint,
    };
  }
}

export function isPhysicalSystemsError(
  error: unknown,
): error is PhysicalSystemsError {
  return error instanceof PhysicalSystemsError;
}
