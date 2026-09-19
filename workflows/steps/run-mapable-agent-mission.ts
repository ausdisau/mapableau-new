import {
  runDurableMapAbleMission,
  type DurableMissionInput,
  type DurableMissionResult,
} from "@/lib/ai/platform/runtime/durable-mission-agent";

export async function runMapAbleAgentMissionStep(
  input: DurableMissionInput,
): Promise<DurableMissionResult> {
  "use step";

  // Keep this first durable slice idempotent: the step performs governed
  // reasoning only. AgentRun/AuditEvent persistence will be added once it can
  // bind a workflow run ID to an idempotency key rather than duplicating audit
  // rows on automatic retry.
  return runDurableMapAbleMission(input);
}
