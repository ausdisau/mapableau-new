import { buildAgentContext } from "@/lib/agents/agent-context";
import { runMapableAgent } from "@/lib/agents/agent-runner";
import { agentErrorResponse } from "@/lib/agents/api-utils";
import type { AgentRunRequest, MapAbleAgentId } from "@/lib/agents/agent-types";
import { runIncidentTriageGraph } from "@/lib/agents/graphs/incident-triage-graph";
import { runInvoiceReviewGraph } from "@/lib/agents/graphs/invoice-review-graph";
import { runServiceRecoveryGraph } from "@/lib/agents/graphs/service-recovery-graph";
import { runSupportRequestGraph } from "@/lib/agents/graphs/support-request-graph";
import { runTelehealthIntakeGraph } from "@/lib/agents/graphs/telehealth-intake-graph";
import { runEvidencePackWorkflow } from "@/lib/agents/workflows/evidence-pack-workflow";
import { runClaimValidationWorkflow } from "@/lib/agents/workflows/claim-validation-workflow";
import { requireApiSession } from "@/lib/api/auth-handler";
import { agentsConfig, assertAgentsEnabled } from "@/lib/config/agents";

export const maxDuration = 60;

const GRAPH_HANDLERS = {
  incident_triage: runIncidentTriageGraph,
  invoice_review: runInvoiceReviewGraph,
  service_recovery: runServiceRecoveryGraph,
  support_request: runSupportRequestGraph,
  telehealth_intake: runTelehealthIntakeGraph,
} as const;

export async function POST(req: Request) {
  try {
    assertAgentsEnabled();
    const user = await requireApiSession();
    if (user instanceof Response) return user;

    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message : "";
    if (!message.trim()) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const context = await buildAgentContext(user, body?.sessionId);
    const graphId = body?.graphId as keyof typeof GRAPH_HANDLERS | undefined;

    if (graphId && graphId in GRAPH_HANDLERS) {
      const graphResult = await GRAPH_HANDLERS[graphId]({ message, context });
      return Response.json({
        graphId,
        structuredOutput: graphResult,
        response: graphResult.summary,
        actionStatus: graphResult.finalStatus,
        requiresHumanConfirmation: graphResult.requiresHumanConfirmation,
        toolCalls: [],
      });
    }

    if (body?.workflowId === "evidence_pack") {
      const wf = await runEvidencePackWorkflow({
        context,
        sourceIds: body?.sourceIds,
      });
      return Response.json({
        agentId: "evidence_pack",
        response: String(wf.output.message),
        structuredOutput: wf,
        actionStatus: "requires_human_review",
        requiresHumanConfirmation: true,
        toolCalls: [],
      });
    }

    if (body?.workflowId === "claim_validation" && body?.invoiceId) {
      const wf = await runClaimValidationWorkflow({
        invoiceId: String(body.invoiceId),
      });
      return Response.json({
        agentId: "billing_pricing",
        response: `Claim validation: ${wf.blockers.length ? "blockers found" : "warnings only"}.`,
        structuredOutput: wf,
        actionStatus: wf.blockers.length ? "blocked" : "drafted",
        requiresHumanConfirmation: wf.participantApprovalRequired,
        toolCalls: [],
      });
    }

    const request: AgentRunRequest = {
      agentId: body?.agentId as MapAbleAgentId | undefined,
      message,
      context,
      conversationId: body?.conversationId,
      attachments: body?.attachments,
    };

    const result = await runMapableAgent(request);
    return Response.json(result);
  } catch (error) {
    return agentErrorResponse(error);
  }
}

export async function GET() {
  try {
    return Response.json({
      enabled: agentsConfig.agentsEnabled,
      streaming: agentsConfig.agentStreamingEnabled,
      provider: agentsConfig.agentProvider,
    });
  } catch (error) {
    return agentErrorResponse(error);
  }
}
