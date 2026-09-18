import type {
  DurableMissionInput,
  DurableMissionResult,
} from "@/lib/ai/platform/runtime/durable-mission-agent";

import { runMapAbleAgentMissionStep } from "./steps/run-mapable-agent-mission";

export async function mapAbleAgentMissionWorkflow(
  input: DurableMissionInput,
): Promise<DurableMissionResult> {
  "use workflow";

  return runMapAbleAgentMissionStep(input);
}
