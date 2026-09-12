import { createAgentRun } from "@/lib/ai/agent-ops/agent-run-service";

export const CRISIS_COMMUNICATION_ACCESS = [
  "aac_or_typed",
  "extra_response_time",
  "relay_or_text_preferred",
] as const;

export type CrisisCommunicationAccess =
  (typeof CRISIS_COMMUNICATION_ACCESS)[number];

export type CrisisHumanHandoffState =
  | "HUMAN_ASSISTANCE_REQUESTED"
  | "HUMAN_ASSISTED"
  | "EXTERNAL_ACCEPTED";

export type CrisisHumanHandoffResult = {
  recorded: boolean;
  runId: string | null;
  state: "HUMAN_ASSISTANCE_REQUESTED";
  externalAcceptanceConfirmed: false;
  freeTextStored: false;
};

function isCrisisCommunicationAccess(
  value: string,
): value is CrisisCommunicationAccess {
  return (CRISIS_COMMUNICATION_ACCESS as readonly string[]).includes(value);
}

export function normaliseCrisisCommunicationAccess(
  values?: readonly string[],
): CrisisCommunicationAccess[] {
  if (!values) return [];
  return Array.from(
    new Set(values.filter(isCrisisCommunicationAccess)),
  ).slice(0, CRISIS_COMMUNICATION_ACCESS.length);
}

/**
 * Builds the minimum metadata needed to route a participant-requested human
 * review. The crisis conversation itself is deliberately excluded.
 */
export function buildCrisisHandoffAuditSummary(input: {
  sessionId?: string;
  communicationAccess?: readonly string[];
}) {
  return {
    source: "mapable_crisis_support",
    referralState: "USER_INITIATED" as const,
    handoffState: "HUMAN_ASSISTANCE_REQUESTED" as const,
    requestType: "mapable_human_assistance" as const,
    communicationAccess: normaliseCrisisCommunicationAccess(
      input.communicationAccess,
    ),
    sessionId: input.sessionId?.slice(0, 80),
    freeTextStored: false as const,
    externalAcceptanceConfirmed: false as const,
  };
}

/**
 * Records a participant-controlled request for MapAble human review without
 * copying crisis free text, location, contacts or disability narrative into
 * the AgentRun. This is not evidence that a human or external crisis service
 * has accepted the request.
 */
export async function recordCrisisHumanAssistanceRequest(input: {
  userId: string;
  participantId?: string;
  sessionId?: string;
  communicationAccess?: readonly string[];
}): Promise<CrisisHumanHandoffResult> {
  const inputSummary = buildCrisisHandoffAuditSummary(input);

  const run = await createAgentRun({
    agentType: "safeguarding_triage",
    participantId: input.participantId ?? input.userId,
    actorUserId: input.userId,
    inputSummary,
    outputSummary: {
      handoff: "requested_for_human_review",
      handoffState: "HUMAN_ASSISTANCE_REQUESTED",
      externalAcceptanceConfirmed: false,
      freeTextStored: false,
    },
    toolsCalled: ["request_human_support"],
    guardrailsTriggered: [
      "mental_health_crisis_handoff_requested",
      "sensitive_text_minimised",
    ],
    riskTier: "high",
    humanReviewRequired: true,
    participantConfirmationRequired: false,
  });

  return {
    recorded: !("skipped" in run && run.skipped),
    runId: run.id ?? null,
    state: "HUMAN_ASSISTANCE_REQUESTED",
    externalAcceptanceConfirmed: false,
    freeTextStored: false,
  };
}
