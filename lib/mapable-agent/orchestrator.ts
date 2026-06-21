import { createAgentRun } from "@/lib/agent-ops/agent-run-service";
import { mapableAgentConfig, isMapableAgentConfigured } from "@/lib/mapable-agent/config";
import { checkConsentGate } from "@/lib/mapable-agent/consent-gate";
import { classifyMapableAgentIntent } from "@/lib/mapable-agent/intent-router";
import { getMapableAgentModelProvider } from "@/lib/mapable-agent/model";
import { renderAgentResponse } from "@/lib/mapable-agent/response-renderer";
import { createMapableAgent } from "@/lib/mapable-agent/agent-tools";
import type {
  OrchestratorTurnInput,
  OrchestratorTurnResult,
} from "@/lib/mapable-agent/types";
import { prisma } from "@/lib/prisma";

const PARTICIPANT_SCOPES = ["profile.read"] as const;

export async function runMapableAgentTurn(
  input: OrchestratorTurnInput,
): Promise<OrchestratorTurnResult> {
  if (!isMapableAgentConfigured()) {
    throw new Error("MapAble Agent is not enabled");
  }

  const session = await prisma.agentSession.findUnique({
    where: { id: input.sessionId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  const intent = classifyMapableAgentIntent(input.message);
  const participantId = input.participantId ?? session.participantId;

  const consent = await checkConsentGate({
    participantId,
    scopes:
      intent.type === "plan" || intent.type === "billing"
        ? [...PARTICIPANT_SCOPES]
        : undefined,
  });

  if (!consent.allowed) {
    return {
      sessionId: input.sessionId,
      text: "We need your consent before we can use participant records. Please confirm in the panel below.",
      toolsCalled: [],
      humanReviewRequired: false,
      pendingReviewTaskIds: [],
      warnings: [],
      requiredConfirmations: consent.requiredConfirmations,
    };
  }

  await prisma.agentMessage.create({
    data: {
      sessionId: input.sessionId,
      role: "user",
      content: input.message,
    },
  });

  const agentRun = await createAgentRun({
    agentType: "mapable_agent",
    participantId: participantId ?? undefined,
    sessionId: input.sessionId,
    inputSummary: { message: input.message, intent: intent.type },
    actorUserId: input.actorUserId ?? undefined,
  });

  const ctx = {
    actorUserId: input.actorUserId,
    participantId,
    sessionId: input.sessionId,
    agentRunId: agentRun.id ?? undefined,
  };

  const provider = getMapableAgentModelProvider();
  let text: string;
  let reasoningSummary: string | undefined;
  let toolsCalled: string[] = [];
  let confidence = intent.confidence;

  try {
    const agent = createMapableAgent(intent.type, ctx);
    const result = await agent.generate({ prompt: input.message });
    text = result.text;
    toolsCalled = result.steps.flatMap((s) => s.toolCalls.map((c) => c.toolName));
    confidence = 0.85;
  } catch {
    const fallback = await provider.chat({
      messages: [
        { role: "system", content: "MapAble Agent assistant" },
        { role: "user", content: input.message },
      ],
    });
    const rendered = renderAgentResponse(fallback);
    text = rendered.text;
    reasoningSummary = rendered.reasoningSummary;
  }

  const rendered = renderAgentResponse({ text, reasoningSummary, confidence });

  await prisma.agentMessage.create({
    data: {
      sessionId: input.sessionId,
      role: "assistant",
      content: rendered.text,
      reasoningSummary: rendered.reasoningSummary,
      confidence,
    },
  });

  const pendingReviews = await prisma.humanReviewTask.findMany({
    where: { sessionId: input.sessionId, status: "pending" },
    select: { id: true },
  });

  if (agentRun.id) {
    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: {
        sessionId: input.sessionId,
        outputSummary: { text: rendered.text, toolsCalled },
        toolsCalled,
        humanReviewRequired: pendingReviews.length > 0,
        status: "completed",
      },
    });
  }

  return {
    sessionId: input.sessionId,
    text: rendered.text,
    reasoningSummary: rendered.showReasoning ? rendered.reasoningSummary : undefined,
    toolsCalled,
    humanReviewRequired: pendingReviews.length > 0,
    pendingReviewTaskIds: pendingReviews.map((r) => r.id),
    warnings: [],
    requiredConfirmations: [],
    confidence,
  };
}

export async function createAgentSession(params: {
  actorUserId?: string | null;
  participantId?: string | null;
  title?: string;
}) {
  return prisma.agentSession.create({
    data: {
      actorUserId: params.actorUserId ?? null,
      participantId: params.participantId ?? null,
      title: params.title ?? "New conversation",
      modelProvider: mapableAgentConfig.modelProvider,
    },
  });
}

export async function streamMapableAgentTurn(
  input: OrchestratorTurnInput,
): Promise<AsyncIterable<{ type: string; text?: string }>> {
  const provider = getMapableAgentModelProvider();
  async function* gen() {
    for await (const chunk of provider.chatStream({
      messages: [{ role: "user", content: input.message }],
    })) {
      if (chunk.type === "text-delta") {
        yield { type: "text-delta", text: chunk.text };
      }
      if (chunk.type === "done") {
        yield { type: "done", text: chunk.result.text };
      }
    }
  }
  return gen();
}
