import type { CopilotActionPlan } from "@/lib/copilot/types";
import {
  runProviderFinderAskTurn,
  serialiseFinderPayload,
  type ProviderFinderSessionFields,
} from "@/lib/provider-finder/ask-bridge";

const DIRECTORY_DISCLAIMER =
  "Provider listings come from the public NDIS provider finder export. They are not verified by MapAble as current NDIS registration.";

export async function planProviderFinderCopilotActions(
  query: string,
  session?: Partial<ProviderFinderSessionFields>,
  options?: { providerSlug?: string; providerName?: string },
): Promise<CopilotActionPlan> {
  const turn = await runProviderFinderAskTurn(query, session, options);
  const finderPayload = serialiseFinderPayload(turn);

  const lowConfidence =
    turn.interpretation.parsed && turn.interpretation.confidence < 0.6;

  return {
    summary: "Provider search",
    plainLanguageAnswer: turn.replyText,
    filters: {
      finder: finderPayload,
    },
    actions: [
      {
        type: "OPEN_PROVIDER_SEARCH",
        label: "Show matching providers",
        requiresConfirmation: false,
      },
    ],
    draftRecords: [],
    requiredConfirmations: [],
    warnings: [
      {
        level: "info",
        message: DIRECTORY_DISCLAIMER,
      },
      ...(lowConfidence
        ? [
            {
              level: "warning" as const,
              message:
                "AI-suggested filters — adjust any field if something looks off.",
            },
          ]
        : []),
    ],
  };
}
