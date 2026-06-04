import {
  applyInterpretationToFields,
  buildFinderSearchParams,
  type AppliedSearchFields,
} from "@/lib/search/apply-interpretation";
import type { SearchInterpretation } from "@/types/search";

import { runProviderFinderConversationTurn } from "./conversation/run-turn";

export type ProviderFinderSessionFields = {
  query: string;
  location: string;
  providerName: string;
  serviceQuery: string;
  accessQuery: string;
};

export type ProviderFinderAskTurn = {
  interpretation: SearchInterpretation;
  applied: AppliedSearchFields;
  replyText: string;
  searchParams: URLSearchParams;
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
 * Single source of truth: NL query → interpretation → finder field snapshot → URL params.
 */
export async function runProviderFinderAskTurn(
  userText: string,
  currentFields?: Partial<ProviderFinderSessionFields>,
  options?: { providerName?: string; providerSlug?: string },
): Promise<ProviderFinderAskTurn> {
  const session: ProviderFinderSessionFields = {
    query: currentFields?.query ?? "",
    location: currentFields?.location ?? "",
    providerName:
      currentFields?.providerName?.trim() ||
      options?.providerName?.trim() ||
      "",
    serviceQuery: currentFields?.serviceQuery ?? "",
    accessQuery: currentFields?.accessQuery ?? "",
  };

  const effectiveQuery = mergeProviderContextIntoQuery(userText, options);
  const turn = await runProviderFinderConversationTurn(effectiveQuery, session);

  if (options?.providerName && !turn.applied.providerName) {
    turn.applied.providerName = options.providerName;
  }

  const searchParams = buildFinderSearchParams(turn.applied);

  return {
    interpretation: turn.interpretation,
    applied: turn.applied,
    replyText: turn.replyText,
    searchParams,
  };
}

/** JSON-safe finder payload for Co-Pilot API responses. */
export function serialiseFinderPayload(turn: ProviderFinderAskTurn) {
  return {
    interpretation: turn.interpretation,
    applied: turn.applied,
    searchParams: Object.fromEntries(turn.searchParams.entries()),
    replyText: turn.replyText,
  };
}
