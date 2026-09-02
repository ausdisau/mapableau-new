/**
 * Deterministic watch rules. No LLM. No operational action creation.
 */

import { buildWatchFingerprint, shouldSuppressDuplicate } from "./attention";
import {
  defaultBucketForType,
  defaultParticipantActions,
  watchTypeLabel,
} from "./registry";
import {
  approvalExpired,
  computeTemporalConstraint,
  deadlineWarnWindowOpen,
  evidenceIsStale,
  formatInTimeZone,
} from "./temporal";
import type {
  MapAbleMissionWatch,
  WatchEvaluationContext,
  WatchRuleResult,
} from "./types";

export function evaluateWatchRule(
  watch: MapAbleMissionWatch,
  ctx: WatchEvaluationContext,
): WatchRuleResult {
  const baseActions = defaultParticipantActions(watch);
  if (isConsentBlocked(watch, ctx)) {
    return buildResult(watch, {
      fired: false,
      suppressed: true,
      suppressReason: "consent_revoked",
      fingerprint: buildWatchFingerprint({
        watchId: watch.watchId,
        watchType: watch.watchType,
        missionId: watch.missionId,
        conditionKey: "consent_revoked",
        severity: watch.severity,
      }),
      explanation: "This watch is paused because required consent was revoked.",
      recommendation: "Restore consent or disable the watch if it is no longer needed.",
      recoveryEventType: null,
      participantActions: ["take_no_action", "disable_optional", "request_human_help"],
    });
  }

  const firedCheck = checkCondition(watch, ctx);
  const fingerprint = buildWatchFingerprint({
    watchId: watch.watchId,
    watchType: watch.watchType,
    missionId: watch.missionId,
    conditionKey: firedCheck.conditionKey,
    severity: firedCheck.severity ?? watch.severity,
  });

  if (!firedCheck.fired) {
    return buildResult(watch, {
      fired: false,
      suppressed: false,
      suppressReason: null,
      fingerprint,
      explanation: firedCheck.explanation,
      recommendation: firedCheck.recommendation,
      recoveryEventType: null,
      participantActions: baseActions,
      severity: firedCheck.severity,
    });
  }

  const dup = shouldSuppressDuplicate({
    watch,
    fingerprint,
    referenceTime: ctx.referenceTime,
  });
  if (dup.suppress) {
    return buildResult(watch, {
      fired: true,
      suppressed: true,
      suppressReason: dup.reason,
      fingerprint,
      explanation: `${firedCheck.explanation} (alert suppressed: ${dup.reason})`,
      recommendation: firedCheck.recommendation,
      recoveryEventType: firedCheck.recoveryEventType,
      participantActions: baseActions,
      severity: firedCheck.severity,
    });
  }

  return buildResult(watch, {
    fired: true,
    suppressed: false,
    suppressReason: null,
    fingerprint,
    explanation: firedCheck.explanation,
    recommendation: firedCheck.recommendation,
    recoveryEventType: firedCheck.recoveryEventType,
    participantActions: baseActions,
    severity: firedCheck.severity,
  });
}

function isConsentBlocked(
  watch: MapAbleMissionWatch,
  ctx: WatchEvaluationContext,
): boolean {
  if (watch.consentRevoked) return true;
  const required = watch.condition.requiredConsentScopes ?? [];
  if (!required.length) return false;
  return required.some(
    (scope) =>
      ctx.revokedConsentScopes.includes(scope) ||
      !ctx.actorConsentScopes.includes(scope),
  );
}

type ConditionCheck = {
  fired: boolean;
  conditionKey: string;
  explanation: string;
  recommendation: string;
  recoveryEventType: WatchRuleResult["recoveryEventType"];
  severity?: WatchRuleResult["severity"];
};

function checkCondition(
  watch: MapAbleMissionWatch,
  ctx: WatchEvaluationContext,
): ConditionCheck {
  switch (watch.watchType) {
    case "deadline":
      return checkDeadline(watch, ctx);
    case "departure_readiness":
      return checkDepartureReadiness(watch, ctx);
    case "service_confirmation":
      return checkServiceConfirmation(watch);
    case "approval_expiry":
      return checkApprovalExpiry(watch, ctx);
    case "evidence_freshness":
      return checkEvidenceFreshness(watch, ctx);
    case "dependency_health":
      return checkDependencyHealth(watch, ctx);
    case "human_review_wait":
      return checkHumanReviewWait(watch, ctx);
    case "participant_requested_reminder":
      return checkParticipantReminder(watch, ctx);
    default: {
      const _never: never = watch.watchType;
      void _never;
      return {
        fired: false,
        conditionKey: "unknown",
        explanation: "Unknown watch type.",
        recommendation: "Take no action.",
        recoveryEventType: null,
      };
    }
  }
}

function checkDeadline(
  watch: MapAbleMissionWatch,
  ctx: WatchEvaluationContext,
): ConditionCheck {
  const deadline = watch.condition.deadlineIso ?? watch.triggerAt;
  if (!deadline) {
    return {
      fired: false,
      conditionKey: "no_deadline",
      explanation: "No deadline is set for this watch.",
      recommendation: "Take no action.",
      recoveryEventType: null,
    };
  }
  const warnBefore = watch.condition.warnBeforeMinutes ?? 120;
  const constraint = computeTemporalConstraint({
    nodeId: watch.affectedNodeIds[0] ?? "deadline",
    label: watchTypeLabel(watch.watchType),
    deadlineIso: deadline,
    bufferMinutes: watch.condition.bufferMinutes,
    leadTimeMinutes: watch.condition.leadTimeMinutes,
    referenceTime: ctx.referenceTime,
  });
  const inWindow = deadlineWarnWindowOpen({
    deadlineIso: deadline,
    warnBeforeMinutes: warnBefore,
    referenceTime: ctx.referenceTime,
  });
  const impossible = constraint.status === "impossible";
  if (!inWindow && !impossible) {
    return {
      fired: false,
      conditionKey: `deadline_ok:${deadline}`,
      explanation: `Deadline ${formatInTimeZone(deadline, watch.timeZone)} is not yet in the warning window.`,
      recommendation: "Take no action.",
      recoveryEventType: null,
    };
  }
  return {
    fired: true,
    conditionKey: `deadline:${deadline}:${constraint.status}`,
    explanation: impossible
      ? constraint.explanation
      : `Deadline approaching at ${formatInTimeZone(deadline, watch.timeZone)} (${watch.timeZone}).`,
    recommendation:
      "Review your plan now. MapAble can reassess and suggest options — it will not book or change services for you.",
    recoveryEventType: "DEADLINE_APPROACHING",
    severity: impossible ? "critical" : "urgent",
  };
}

function checkDepartureReadiness(
  watch: MapAbleMissionWatch,
  ctx: WatchEvaluationContext,
): ConditionCheck {
  const deadline = watch.condition.deadlineIso ?? watch.triggerAt;
  const transportOk = watch.condition.transportConfirmed !== false;
  const unconfirmed =
    (ctx.unconfirmedTransportNodeIds ?? []).length > 0 ||
    watch.condition.transportConfirmed === false;
  if (!deadline) {
    return {
      fired: unconfirmed,
      conditionKey: unconfirmed ? "departure_unconfirmed" : "departure_ok",
      explanation: unconfirmed
        ? "Transport is not confirmed for departure."
        : "Departure readiness looks fine.",
      recommendation: unconfirmed
        ? "Confirm transport or ask for human help."
        : "Take no action.",
      recoveryEventType: unconfirmed ? "TRANSPORT_UNAVAILABLE" : null,
    };
  }
  const warnBefore = watch.condition.warnBeforeMinutes ?? 90;
  const approaching = deadlineWarnWindowOpen({
    deadlineIso: deadline,
    warnBeforeMinutes: warnBefore,
    referenceTime: ctx.referenceTime,
  });
  const fired = approaching && (!transportOk || unconfirmed);
  return {
    fired,
    conditionKey: fired
      ? `departure_not_ready:${deadline}`
      : `departure_ready:${deadline}`,
    explanation: fired
      ? `Departure soon (${formatInTimeZone(deadline, watch.timeZone)}) but transport is not confirmed.`
      : "Departure readiness is acceptable.",
    recommendation: fired
      ? "Confirm transport arrangements or reassess your plan."
      : "Take no action.",
    recoveryEventType: fired ? "TRANSPORT_UNAVAILABLE" : null,
  };
}

function checkServiceConfirmation(watch: MapAbleMissionWatch): ConditionCheck {
  const confirmed = watch.condition.serviceConfirmed === true;
  const fired = !confirmed;
  return {
    fired,
    conditionKey: confirmed ? "service_confirmed" : "service_unconfirmed",
    explanation: fired
      ? "A required service is not yet confirmed."
      : "Service is confirmed.",
    recommendation: fired
      ? "Confirm the service or request human coordination."
      : "Take no action.",
    recoveryEventType: fired ? "PROVIDER_CANCELLED" : null,
    severity: fired ? "attention" : undefined,
  };
}

function checkApprovalExpiry(
  watch: MapAbleMissionWatch,
  ctx: WatchEvaluationContext,
): ConditionCheck {
  const expiresAt = watch.condition.approvalExpiresAt;
  if (!expiresAt) {
    return {
      fired: false,
      conditionKey: "no_approval_expiry",
      explanation: "No approval expiry is set.",
      recommendation: "Take no action.",
      recoveryEventType: null,
    };
  }
  const expired = approvalExpired(expiresAt, ctx.referenceTime);
  const warnBefore = watch.condition.warnBeforeMinutes ?? 60;
  const approaching = deadlineWarnWindowOpen({
    deadlineIso: expiresAt,
    warnBeforeMinutes: warnBefore,
    referenceTime: ctx.referenceTime,
  });
  const fired = expired || approaching;
  return {
    fired,
    conditionKey: `approval:${expiresAt}:${expired ? "expired" : "approaching"}`,
    explanation: expired
      ? `Approval expired at ${formatInTimeZone(expiresAt, watch.timeZone)}.`
      : `Approval expires soon at ${formatInTimeZone(expiresAt, watch.timeZone)}.`,
    recommendation:
      "Review and reapprove if you still want the proposed action. Nothing executes without your approval.",
    recoveryEventType: "APPROVAL_EXPIRED",
    severity: expired ? "critical" : "urgent",
  };
}

function checkEvidenceFreshness(
  watch: MapAbleMissionWatch,
  ctx: WatchEvaluationContext,
): ConditionCheck {
  const maxAge = watch.condition.evidenceMaxAgeMinutes ?? 24 * 60;
  const staleFromCondition = evidenceIsStale({
    observedAt: watch.condition.evidenceObservedAt,
    maxAgeMinutes: maxAge,
    referenceTime: ctx.referenceTime,
  });
  const staleIds = ctx.evidenceStaleNodeIds ?? [];
  const staleFromCtx =
    staleIds.some((id) => watch.affectedNodeIds.includes(id)) ||
    (staleIds.length > 0 && watch.affectedNodeIds.length === 0);
  const fired = staleFromCondition || staleFromCtx;
  return {
    fired,
    conditionKey: fired
      ? `evidence_stale:${watch.condition.evidenceObservedAt ?? "missing"}`
      : `evidence_fresh:${watch.condition.evidenceObservedAt ?? "none"}`,
    explanation: fired
      ? "Access or mission evidence may be out of date."
      : "Evidence appears fresh enough for this watch.",
    recommendation: fired
      ? "Open evidence and refresh observations, or reassess the mission."
      : "Take no action.",
    recoveryEventType: fired ? "EVIDENCE_STALE" : null,
  };
}

function checkDependencyHealth(
  watch: MapAbleMissionWatch,
  ctx: WatchEvaluationContext,
): ConditionCheck {
  const nodeIds = watch.condition.dependencyNodeIds ?? watch.affectedNodeIds ?? [];
  const statuses = ctx.planNodeStatuses ?? {};
  const unhealthy = nodeIds.filter((id) => {
    const status = statuses[id];
    return (
      status === "unavailable" ||
      status === "missing" ||
      status === "needs_review" ||
      status === "not_authorised"
    );
  });
  const flaggedUnhealthy = watch.condition.dependencyHealthy === false;
  const fired = flaggedUnhealthy || unhealthy.length > 0;
  return {
    fired,
    conditionKey: fired
      ? `dep_unhealthy:${unhealthy.join(",") || "flagged"}`
      : "dep_healthy",
    explanation: fired
      ? `Mission dependencies need attention: ${unhealthy.join(", ") || "marked unhealthy"}.`
      : "Dependencies look healthy.",
    recommendation: fired
      ? "Reassess now to see recovery options. MapAble will not change bookings for you."
      : "Take no action.",
    recoveryEventType: fired ? "PROVIDER_CANCELLED" : null,
  };
}

function checkHumanReviewWait(
  watch: MapAbleMissionWatch,
  ctx: WatchEvaluationContext,
): ConditionCheck {
  const pending =
    watch.condition.humanReviewPending === true ||
    (ctx.pendingHumanReviewNodeIds ?? []).length > 0;
  return {
    fired: pending,
    conditionKey: pending ? "human_review_pending" : "human_review_clear",
    explanation: pending
      ? "This mission is waiting on human review."
      : "No human review wait for this watch.",
    recommendation: pending
      ? "You can request human help or take no action while review continues."
      : "Take no action.",
    recoveryEventType: null,
  };
}

function checkParticipantReminder(
  watch: MapAbleMissionWatch,
  ctx: WatchEvaluationContext,
): ConditionCheck {
  const trigger = watch.triggerAt;
  if (!trigger) {
    return {
      fired: false,
      conditionKey: "no_trigger",
      explanation: "Reminder has no trigger time.",
      recommendation: "Take no action.",
      recoveryEventType: null,
    };
  }
  const due = new Date(trigger).getTime() <= ctx.referenceTime.getTime();
  return {
    fired: due,
    conditionKey: `reminder:${trigger}`,
    explanation: due
      ? watch.condition.reminderMessage ??
        `Reminder for ${formatInTimeZone(trigger, watch.timeZone)}.`
      : "Reminder is not due yet.",
    recommendation: due
      ? "Review your mission or snooze/disable this optional reminder."
      : "Take no action.",
    recoveryEventType: null,
    severity: "info",
  };
}

function buildResult(
  watch: MapAbleMissionWatch,
  partial: {
    fired: boolean;
    suppressed: boolean;
    suppressReason: string | null;
    fingerprint: string;
    explanation: string;
    recommendation: string;
    recoveryEventType: WatchRuleResult["recoveryEventType"];
    participantActions: WatchRuleResult["participantActions"];
    severity?: WatchRuleResult["severity"];
  },
): WatchRuleResult {
  return {
    watchId: watch.watchId,
    missionId: watch.missionId,
    watchType: watch.watchType,
    fired: partial.fired,
    suppressed: partial.suppressed,
    suppressReason: partial.suppressReason,
    severity: partial.severity ?? watch.severity,
    bucket: defaultBucketForType(watch.watchType),
    fingerprint: partial.fingerprint,
    explanation: partial.explanation,
    recommendation: partial.recommendation,
    affectedNodeIds: watch.affectedNodeIds,
    recoveryEventType: partial.recoveryEventType,
    participantActions: partial.participantActions,
    operationalActionCreated: false,
  };
}
