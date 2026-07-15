import type { AccessSearchIntent, AccessSearchResult } from "@/types/access-chat";

export type AccessChatTurn = {
  role: "user" | "assistant";
  content: string;
  results?: AccessSearchResult[];
  intent?: AccessSearchIntent;
  messageId: string;
  createdAt: number;
};

export type AccessChatSession = {
  sessionId: string;
  turns: AccessChatTurn[];
  lastIntent: AccessSearchIntent | null;
  updatedAt: number;
};

const TTL_MS = 60 * 60 * 1000;
const MAX_TURNS = 24;
const store = new Map<string, AccessChatSession>();

function pruneExpired(now: number) {
  for (const [id, session] of store) {
    if (now - session.updatedAt > TTL_MS) store.delete(id);
  }
}

export function getAccessChatSession(
  sessionId: string,
): AccessChatSession | null {
  pruneExpired(Date.now());
  return store.get(sessionId) ?? null;
}

export function touchAccessChatSession(sessionId: string): AccessChatSession {
  pruneExpired(Date.now());
  const existing = store.get(sessionId);
  if (existing) {
    existing.updatedAt = Date.now();
    return existing;
  }
  const created: AccessChatSession = {
    sessionId,
    turns: [],
    lastIntent: null,
    updatedAt: Date.now(),
  };
  store.set(sessionId, created);
  return created;
}

export function appendAccessChatTurn(
  sessionId: string,
  turn: AccessChatTurn,
): AccessChatSession {
  const session = touchAccessChatSession(sessionId);
  session.turns.push(turn);
  if (session.turns.length > MAX_TURNS) {
    session.turns = session.turns.slice(-MAX_TURNS);
  }
  if (turn.intent) session.lastIntent = turn.intent;
  session.updatedAt = Date.now();
  return session;
}

export function newAccessChatMessageId(): string {
  return `acm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
