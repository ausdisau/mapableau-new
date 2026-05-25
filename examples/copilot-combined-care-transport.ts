/**
 * Runnable demo: combined care + transport Co-Pilot pipeline.
 * Run: pnpm exec tsx examples/copilot-combined-care-transport.ts
 */

import { planCopilotActions } from "@/lib/copilot/actionPlanner";
import { buildCopilotContext } from "@/lib/copilot/contextBuilder";
import { applyGuardrails } from "@/lib/copilot/guardrails";
import { classifyIntent } from "@/lib/copilot/intentRouter";
import { MOCK_PARTICIPANT_ID } from "@/lib/prms/mockPrmsData";
import { buildParticipantGraph } from "@/lib/prms/participantGraph";

const DEMO_QUERY =
  "I need a support worker and wheelchair transport to my physio appointment next Tuesday morning";

async function main() {
  const graph = buildParticipantGraph(MOCK_PARTICIPANT_ID);
  const intent = classifyIntent(DEMO_QUERY);
  const context = await buildCopilotContext(MOCK_PARTICIPANT_ID);
  const planned = await planCopilotActions({
    query: DEMO_QUERY,
    mode: "All",
    intent,
    context,
    sessionId: "example-session",
    participantId: MOCK_PARTICIPANT_ID,
  });
  const guarded = await applyGuardrails({
    planned,
    context,
    participantId: MOCK_PARTICIPANT_ID,
    query: DEMO_QUERY,
  });

  const summary = {
    intent: intent.type,
    confidence: intent.confidence,
    graphNodes: graph
      ? {
          documents: graph.documents.length,
          invoices: graph.invoices.length,
          incidents: graph.incidents.length,
          services: graph.services.length,
        }
      : null,
    summary: guarded.summary,
    draftTypes: guarded.draftRecords.map((r) => r.type),
    confirmationGates: guarded.requiredConfirmations.map((g) => g.type),
    warningCount: guarded.warnings.length,
    blockedActionCount: guarded.blockedActions.length,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
