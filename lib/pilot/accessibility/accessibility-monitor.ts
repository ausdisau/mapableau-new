import { runAssistiveTechnologyChecks } from "@/lib/pilot/accessibility/assistive-technology-tests";
import { listCriticalJourneyIds } from "@/lib/pilot/accessibility/critical-journey-tests";

export function monitorPilotAccessibility(): {
  atChecks: ReturnType<typeof runAssistiveTechnologyChecks>;
  criticalJourneys: string[];
  healthy: boolean;
} {
  const atChecks = runAssistiveTechnologyChecks();
  return {
    atChecks,
    criticalJourneys: listCriticalJourneyIds(),
    healthy: atChecks.every((c) => c.passed),
  };
}
