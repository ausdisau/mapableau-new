/**
 * Human support pathway for Ask MapAble.
 * Reuses AgentRun audit + public contact/safety pages — does not invent guest users.
 */

import { createAgentRun } from "@/lib/ai/agent-ops/agent-run-service";

export const HUMAN_HELP_HREF = "/contact";
export const SAFETY_HELP_HREF = "/dashboard/safety";

export type AskHumanHandoffResult = {
  recorded: boolean;
  runId: string | null;
  message: string;
  hrefs: { contact: string; safety: string };
};

export async function recordAskHumanHandoff(input: {
  userId: string;
  participantId?: string;
  reason: string;
  sessionId?: string;
  pathname?: string;
}): Promise<AskHumanHandoffResult> {
  const reason = input.reason.slice(0, 500);
  const run = await createAgentRun({
    agentType: "matching",
    participantId: input.participantId ?? input.userId,
    actorUserId: input.userId,
    inputSummary: {
      source: "ask_mapable",
      reason,
      sessionId: input.sessionId?.slice(0, 80),
      pathname: input.pathname?.slice(0, 200),
    },
    outputSummary: {
      handoff: "human_support_requested",
    },
    toolsCalled: ["escalate_to_human"],
    guardrailsTriggered: ["human_help_requested"],
    riskTier: "medium",
    humanReviewRequired: true,
  });

  return {
    recorded: !("skipped" in run && run.skipped),
    runId: run.id ?? null,
    message:
      "A MapAble person can help. Use Contact or Safety & help — Ask MapAble will not keep you in an AI-only loop.",
    hrefs: { contact: HUMAN_HELP_HREF, safety: SAFETY_HELP_HREF },
  };
}

export function buildHumanHelpAskResponse(message?: string) {
  return {
    summary: "Talk to a person",
    plainLanguageAnswer:
      message ??
      "You can talk to a MapAble person. Open Contact support or Safety & help. If anyone is in immediate danger, call 000.",
    actions: [
      {
        type: "SAFETY_ESCALATION" as const,
        label: "Talk to a person (Contact)",
        requiresConfirmation: false,
        href: HUMAN_HELP_HREF,
      },
      {
        type: "GUIDANCE_ONLY" as const,
        label: "Safety & help",
        requiresConfirmation: false,
        href: SAFETY_HELP_HREF,
      },
    ],
  };
}
