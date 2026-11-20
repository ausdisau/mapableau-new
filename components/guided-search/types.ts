import type { ClarificationSlot } from "@/lib/copilot/types";
import { isSkipClarificationValue } from "@/lib/provider/finder/clarification";

export type GuidedSearchSessionFields = {
  query: string;
  location: string;
  providerName: string;
  serviceQuery: string;
  accessQuery: string;
  skippedSlots?: ClarificationSlot[];
};

export const GUIDED_SEARCH_SESSION_STORAGE_KEY =
  "mapable-guided-search-session-id";

export function getOrCreateGuidedSearchSessionId(): string {
  if (typeof window === "undefined") return `finder-${Date.now()}`;
  let id = sessionStorage.getItem(GUIDED_SEARCH_SESSION_STORAGE_KEY);
  if (!id) {
    id = `finder-${crypto.randomUUID?.() ?? Date.now()}`;
    sessionStorage.setItem(GUIDED_SEARCH_SESSION_STORAGE_KEY, id);
  }
  return id;
}

export function applyChoiceToSession(
  session: GuidedSearchSessionFields,
  slot: ClarificationSlot | undefined,
  value: string,
): GuidedSearchSessionFields {
  const trimmed = value.trim();
  if (!trimmed || !slot) return session;

  if (isSkipClarificationValue(trimmed)) {
    const skippedSlots = [
      ...new Set([...(session.skippedSlots ?? []), slot]),
    ];
    return { ...session, skippedSlots };
  }

  switch (slot) {
    case "location":
      return { ...session, location: trimmed };
    case "service":
      return { ...session, serviceQuery: trimmed };
    case "access":
      return { ...session, accessQuery: trimmed };
    case "general":
      return { ...session, query: trimmed };
    default: {
      const _exhaustive: never = slot;
      return session;
    }
  }
}
