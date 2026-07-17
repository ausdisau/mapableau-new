/**
 * AURA observability event types. These are structural helpers only — the
 * actual audit sinks live under `lib/audit/`. We surface a minimal helper here
 * so all AURA runtime call sites emit consistent event shapes.
 */

export type AuraObservableEvent =
  | { kind: "authority.evaluated"; verdict: string; envelopeId: string | null }
  | { kind: "goal.transition"; fromStatus: string; toStatus: string; goalId: string }
  | { kind: "plan.validated"; planId: string; valid: boolean; errorCount: number }
  | { kind: "plan.simulated"; planId: string; externalWrites: number; ok: boolean }
  | { kind: "approval.evaluated"; approvalId: string; verdict: string }
  | { kind: "execution.transition"; executionId: string; fromState: string; toState: string }
  | { kind: "memory.write_assessed"; participantId: string; verdict: string }
  | { kind: "mcp.access_evaluated"; serverSlug: string; verdict: string }
  | { kind: "a2a.access_evaluated"; peerLabel: string; verdict: string }
  | { kind: "safety.hold_triggered"; reason: string }
  | { kind: "handoff.validated"; kind_: string; ok: boolean };

export function summariseEvent(event: AuraObservableEvent): string {
  switch (event.kind) {
    case "authority.evaluated":
      return `authority verdict=${event.verdict} envelope=${event.envelopeId ?? "-"}`;
    case "goal.transition":
      return `goal ${event.goalId} ${event.fromStatus}->${event.toStatus}`;
    case "plan.validated":
      return `plan ${event.planId} valid=${event.valid} errors=${event.errorCount}`;
    case "plan.simulated":
      return `plan ${event.planId} simulated ok=${event.ok} writes=${event.externalWrites}`;
    case "approval.evaluated":
      return `approval ${event.approvalId} verdict=${event.verdict}`;
    case "execution.transition":
      return `execution ${event.executionId} ${event.fromState}->${event.toState}`;
    case "memory.write_assessed":
      return `memory participant=${event.participantId} verdict=${event.verdict}`;
    case "mcp.access_evaluated":
      return `mcp server=${event.serverSlug} verdict=${event.verdict}`;
    case "a2a.access_evaluated":
      return `a2a peer=${event.peerLabel} verdict=${event.verdict}`;
    case "safety.hold_triggered":
      return `safety.hold ${event.reason}`;
    case "handoff.validated":
      return `handoff kind=${event.kind_} ok=${event.ok}`;
    default: {
      const _exhaustive: never = event;
      throw new Error(`Unhandled AURA event: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
