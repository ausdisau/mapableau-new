import { searchAgentConfig } from "@/lib/config/search-agent";
import type {
  ClarificationSlot,
  CopilotAgentMeta,
  CopilotProviderResult,
} from "@/lib/copilot/types";
import {
  buildFinderSearchParams,
  type AppliedSearchFields,
} from "@/lib/search/apply-interpretation";
import type { SearchInterpretation } from "@/types/search";

import {
  buildClarificationQuestion,
  enrichCopilotAgentMeta,
  isSkipClarificationValue,
  needsProviderFinderClarification,
} from "./clarification";
import { runProviderFinderConversationTurn } from "./conversation/run-turn";
import { mergeAppliedFields } from "./merge-applied";
import { searchProvidersForAppliedTurn } from "./ndis-search-from-applied";

export type ProviderFinderSessionFields = {
  query: string;
  location: string;
  providerName: string;
  serviceQuery: string;
  accessQuery: string;
  skippedSlots?: ClarificationSlot[];
};

export type ProviderFinderAskTurn = {
  interpretation: SearchInterpretation;
  applied: AppliedSearchFields;
  replyText: string;
  searchParams: URLSearchParams;
  providerResults: CopilotProviderResult[];
  agent?: CopilotAgentMeta;
};

export type ProviderFinderAskOptions = {
  providerName?: string;
  providerSlug?: string;
  priorApplied?: AppliedSearchFields;
  priorInterpretation?: SearchInterpretation | null;
  agentSessionId?: string;
  agentTurnIndex?: number;
};

export function mergeProviderContextIntoQuery(
  query: string,
  options?: { providerName?: string; providerSlug?: string },
): string {
  const base = query.trim();
  const name = options?.providerName?.trim();
  const slug = options?.providerSlug?.trim();
  if (name && !base.toLowerCase().includes(name.toLowerCase())) {
    return base ? `${base} — ${name}` : `Tell me about ${name}`;
  }
  if (slug && !base) {
    return `Tell me about provider ${slug.replace(/-/g, " ")}`;
  }
  return base || " ";
}

/**
 * Single source of truth: NL query → interpretation → finder field snapshot → URL params → NDIS search.
 */
export async function runProviderFinderAskTurn(
  userText: string,
  currentFields?: Partial<ProviderFinderSessionFields>,
  options?: ProviderFinderAskOptions,
): Promise<ProviderFinderAskTurn> {
  const skippedSlots = currentFields?.skippedSlots ?? [];
  const session: ProviderFinderSessionFields = {
    query: currentFields?.query ?? "",
    location: currentFields?.location ?? "",
    providerName:
      currentFields?.providerName?.trim() ||
      options?.providerName?.trim() ||
      "",
    serviceQuery: currentFields?.serviceQuery ?? "",
    accessQuery: currentFields?.accessQuery ?? "",
    skippedSlots,
  };

  const turn = isSkipClarificationValue(userText)
    ? skipConversationTurn(session, options)
    : await runProviderFinderConversationTurn(
        mergeProviderContextIntoQuery(userText, options),
        session,
      );

  const applied = mergeAppliedFields(options?.priorApplied, turn.applied);

  if (options?.providerName && !applied.providerName) {
    applied.providerName = options.providerName;
  }

  const sessionId =
    options?.agentSessionId?.trim() || `finder-${Date.now()}`;
  const turnIndex = (options?.agentTurnIndex ?? 0) + 1;

  const clarification = needsProviderFinderClarification(
    turn.interpretation,
    skippedSlots,
  );
  if (clarification) {
    const question = buildClarificationQuestion(
      turn.interpretation,
      skippedSlots,
    );
    const agent = enrichCopilotAgentMeta(
      {
        sessionId,
        turnIndex,
        status: "needs_clarification",
        clarificationQuestion: question,
      },
      turn.interpretation,
      undefined,
      skippedSlots,
    );
    return {
      interpretation: turn.interpretation,
      applied,
      replyText: question,
      searchParams: buildFinderSearchParams(applied),
      providerResults: [],
      agent,
    };
  }

  const providerResults = await searchProvidersForAppliedTurn(
    applied,
    turn.interpretation,
    { limit: searchAgentConfig.providerFinderResultsLimit },
  );

  let replyText = turn.replyText;
  if (providerResults.length > 0) {
    replyText = `${turn.replyText} I found ${providerResults.length} listing${providerResults.length === 1 ? "" : "s"} in the NDIS directory export — use Show matching providers to filter the page, or review the matches below.`;
  }

  const agent = enrichCopilotAgentMeta(
    {
      sessionId,
      turnIndex,
      status: "complete",
    },
    turn.interpretation,
    providerResults,
    skippedSlots,
  );

  return {
    interpretation: turn.interpretation,
    applied,
    replyText,
    searchParams: buildFinderSearchParams(applied),
    providerResults,
    agent,
  };
}

function interpretationFromApplied(
  applied: AppliedSearchFields,
): SearchInterpretation {
  return {
    sourceQuery: applied.query.trim() || " ",
    parsed: true,
    configured: true,
    filters: {
      q: applied.query,
      location: applied.location,
      access: applied.accessQuery,
      service: applied.serviceQuery,
      provider: applied.providerName,
    },
    serviceCategorySlug: null,
    serviceCategoryId: null,
    accessNeedIds: applied.accessNeedIds,
    accessNeeds: {
      ids: applied.accessNeedIds,
      confidence: applied.accessNeedIds.length > 0 ? 0.8 : 0,
      source: applied.accessNeedIds.length > 0 ? "keyword" : "none",
    },
    confidence: 0.4,
    engineId: "skip",
  };
}

function skipConversationTurn(
  session: ProviderFinderSessionFields,
  options?: ProviderFinderAskOptions,
) {
  const applied = mergeAppliedFields(options?.priorApplied, {
    query: session.query,
    location: session.location,
    providerName: session.providerName,
    serviceQuery: session.serviceQuery,
    accessQuery: session.accessQuery,
    supportType: options?.priorApplied?.supportType ?? null,
    accessNeedIds: options?.priorApplied?.accessNeedIds ?? [],
  });
  const interpretation =
    options?.priorInterpretation ?? interpretationFromApplied(applied);
  return {
    interpretation,
    applied,
    replyText:
      "I’ll skip that for now and keep the rest of your search. You can add it later.",
  };
}

/** JSON-safe finder payload for Co-Pilot API responses. */
export function serialiseFinderPayload(turn: ProviderFinderAskTurn) {
  return {
    interpretation: turn.interpretation,
    applied: turn.applied,
    searchParams: Object.fromEntries(turn.searchParams.entries()),
    replyText: turn.replyText,
    providerResults: turn.providerResults,
    agent: turn.agent,
  };
}
