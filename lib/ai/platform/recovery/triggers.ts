import type { MapAbleMissionEvent, MissionEventType, ReassessmentTrigger, TriggerReasonCode } from "./types";

const EVENT_TO_REASON: Partial<Record<MissionEventType, TriggerReasonCode>> = {
  PARTICIPANT_CHANGED_GOAL: "PARTICIPANT_GOAL_CHANGED", TRANSPORT_UNAVAILABLE: "TRANSPORT_DISRUPTION",
  WORKER_CANCELLED: "WORKER_UNAVAILABLE", VENUE_ACCESS_CHANGED: "ACCESS_EVIDENCE_CHANGED",
  PRICE_CHANGED: "PRICE_MATERIAL_CHANGE", CONSENT_REVOKED: "CONSENT_WITHDRAWN",
  ACTION_FAILED: "ACTION_EXECUTION_FAILED", APPROVAL_EXPIRED: "APPROVAL_EXPIRED",
  DEADLINE_APPROACHING: "DEADLINE_IMPOSSIBLE", EVIDENCE_STALE: "EVIDENCE_STALE",
  PROVIDER_CANCELLED: "DEPENDENCY_FAILED", SAFEGUARDING_SIGNAL: "SAFEGUARDING_ESCALATION",
  PARTICIPANT_REJECTED_OPTION: "PARTICIPANT_GOAL_CHANGED",
};
const CRITICAL_TYPES: MissionEventType[] = ["SAFEGUARDING_SIGNAL","CONSENT_REVOKED"];
const HIGH_TYPES: MissionEventType[] = ["TRANSPORT_UNAVAILABLE","WORKER_CANCELLED","ACTION_FAILED","PROVIDER_CANCELLED","DEADLINE_APPROACHING"];

export function evaluateReassessmentTrigger(events: MapAbleMissionEvent[]): ReassessmentTrigger {
  if (events.length === 0) {
    return { shouldReassess: false, reasonCodes: ["NO_REASSESSMENT_NEEDED"], priority: "low", eventIds: [], explanation: "No events to evaluate." };
  }
  const reasonCodes = new Set<TriggerReasonCode>();
  for (const event of events) {
    const code = EVENT_TO_REASON[event.type];
    if (code) reasonCodes.add(code);
    if (event.type === "TRANSPORT_UNAVAILABLE" || event.type === "WORKER_CANCELLED") reasonCodes.add("DEPENDENCY_AT_RISK");
  }
  if (reasonCodes.size === 0) {
    return { shouldReassess: false, reasonCodes: ["NO_REASSESSMENT_NEEDED"], priority: "low", eventIds: events.map(e => e.eventId), explanation: "Events recorded but no reassessment trigger matched." };
  }
  const types = events.map(e => e.type);
  const priority = types.some(t => CRITICAL_TYPES.includes(t)) ? "critical" : types.some(t => HIGH_TYPES.includes(t)) ? "high" : "normal";
  return { shouldReassess: true, reasonCodes: [...reasonCodes], priority, eventIds: events.map(e => e.eventId), explanation: buildTriggerExplanation([...reasonCodes]) };
}

function buildTriggerExplanation(codes: TriggerReasonCode[]): string {
  const parts: string[] = [];
  if (codes.includes("TRANSPORT_DISRUPTION")) parts.push("Transport dependency may be disrupted.");
  if (codes.includes("WORKER_UNAVAILABLE")) parts.push("Support worker availability changed.");
  if (codes.includes("PARTICIPANT_GOAL_CHANGED")) parts.push("Participant goal or preference changed.");
  if (codes.includes("PRICE_MATERIAL_CHANGE")) parts.push("Cost may have changed materially.");
  if (codes.includes("CONSENT_WITHDRAWN")) parts.push("Consent was withdrawn — profile or data use affected.");
  if (codes.includes("SAFEGUARDING_ESCALATION")) parts.push("Safeguarding signal requires human review.");
  if (codes.includes("DEADLINE_IMPOSSIBLE")) parts.push("Current timeline may be impossible.");
  return parts.length ? parts.join(" ") : "Mission dependencies may need review.";
}

export function mergeTriggers(existing: ReassessmentTrigger | null, incoming: ReassessmentTrigger): ReassessmentTrigger {
  if (!existing || !existing.shouldReassess) return incoming;
  if (!incoming.shouldReassess) return existing;
  const reasonCodes = [...new Set([...existing.reasonCodes, ...incoming.reasonCodes])];
  const priorityRank = { low: 0, normal: 1, high: 2, critical: 3 };
  const priority = priorityRank[incoming.priority] > priorityRank[existing.priority] ? incoming.priority : existing.priority;
  return { shouldReassess: true, reasonCodes, priority, eventIds: [...new Set([...existing.eventIds, ...incoming.eventIds])], explanation: `${existing.explanation} ${incoming.explanation}`.trim() };
}
