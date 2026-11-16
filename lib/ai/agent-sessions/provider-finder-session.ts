import type { CopilotAgentMeta } from "@/lib/copilot/types";
import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";
import type { SearchInterpretation } from "@/types/search";

export type ProviderFinderChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ProviderFinderAgentSession = {
  sessionId: string;
  messages: ProviderFinderChatMessage[];
  cumulativeApplied: AppliedSearchFields | null;
  lastInterpretation: SearchInterpretation | null;
  turnIndex: number;
  updatedAt: number;
};

const TTL_MS = 60 * 60 * 1000;
const MAX_MESSAGES = 20;

const store = new Map<string, ProviderFinderAgentSession>();

function emptyApplied(): AppliedSearchFields {
  return {
    query: "",
    location: "",
    providerName: "",
    serviceQuery: "",
    accessQuery: "",
    supportType: null,
    accessNeedIds: [],
  };
}

function pruneExpired(now: number) {
  for (const [id, session] of store) {
    if (now - session.updatedAt > TTL_MS) store.delete(id);
  }
}

export function getProviderFinderSession(
  sessionId: string,
): ProviderFinderAgentSession | null {
  pruneExpired(Date.now());
  return store.get(sessionId) ?? null;
}

export function touchProviderFinderSession(
  sessionId: string,
  initial?: Partial<ProviderFinderAgentSession>,
): ProviderFinderAgentSession {
  pruneExpired(Date.now());
  const existing = store.get(sessionId);
  if (existing) {
    existing.updatedAt = Date.now();
    return existing;
  }
  const created: ProviderFinderAgentSession = {
    sessionId,
    messages: initial?.messages ?? [],
    cumulativeApplied: initial?.cumulativeApplied ?? null,
    lastInterpretation: initial?.lastInterpretation ?? null,
    turnIndex: initial?.turnIndex ?? 0,
    updatedAt: Date.now(),
  };
  store.set(sessionId, created);
  return created;
}

export function appendProviderFinderTurn(
  sessionId: string,
  input: {
    userText: string;
    assistantText: string;
    applied: AppliedSearchFields;
    interpretation: SearchInterpretation;
    agent: CopilotAgentMeta;
  },
): ProviderFinderAgentSession {
  const session = touchProviderFinderSession(sessionId);
  session.messages.push({ role: "user", content: input.userText });
  session.messages.push({
    role: "assistant",
    content: input.assistantText,
  });
  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
  }
  session.cumulativeApplied = input.applied;
  session.lastInterpretation = input.interpretation;
  session.turnIndex = input.agent.turnIndex;
  session.updatedAt = Date.now();
  return session;
}

/**
 * Client form/chip state is authoritative when provided (including empty
 * strings that clear a slot). The in-memory store is a fallback only for
 * omitted fields or when no form session is sent.
 */
export function priorAppliedFromSession(
  sessionId: string | undefined,
  formSession?: {
    query?: string;
    location?: string;
    providerName?: string;
    serviceQuery?: string;
    accessQuery?: string;
  },
): AppliedSearchFields | undefined {
  const fromStore = sessionId
    ? getProviderFinderSession(sessionId)?.cumulativeApplied
    : undefined;

  if (!formSession) return fromStore;

  return {
    ...(fromStore ?? emptyApplied()),
    query:
      formSession.query !== undefined ? formSession.query : fromStore?.query ?? "",
    location:
      formSession.location !== undefined
        ? formSession.location
        : fromStore?.location ?? "",
    providerName:
      formSession.providerName !== undefined
        ? formSession.providerName
        : fromStore?.providerName ?? "",
    serviceQuery:
      formSession.serviceQuery !== undefined
        ? formSession.serviceQuery
        : fromStore?.serviceQuery ?? "",
    accessQuery:
      formSession.accessQuery !== undefined
        ? formSession.accessQuery
        : fromStore?.accessQuery ?? "",
  };
}

/** Test-only */
export function resetProviderFinderSessionsForTests() {
  store.clear();
}
