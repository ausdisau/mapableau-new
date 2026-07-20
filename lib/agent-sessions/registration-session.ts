import type { RegistrationFields } from "@/types/registration-chat";

export type RegistrationAgentSession = {
  sessionId: string;
  fields: RegistrationFields;
  passwordCollected: boolean;
  turnIndex: number;
  updatedAt: number;
};

const TTL_MS = 60 * 60 * 1000;

const store = new Map<string, RegistrationAgentSession>();

function emptyFields(): RegistrationFields {
  return { name: "", email: "" };
}

function pruneExpired(now: number) {
  for (const [id, session] of store) {
    if (now - session.updatedAt > TTL_MS) store.delete(id);
  }
}

export function getRegistrationSession(
  sessionId: string,
): RegistrationAgentSession | null {
  pruneExpired(Date.now());
  return store.get(sessionId) ?? null;
}

export function touchRegistrationSession(
  sessionId: string,
  initial?: Partial<RegistrationAgentSession>,
): RegistrationAgentSession {
  pruneExpired(Date.now());
  const existing = store.get(sessionId);
  if (existing) {
    existing.updatedAt = Date.now();
    return existing;
  }
  const created: RegistrationAgentSession = {
    sessionId,
    fields: initial?.fields ?? emptyFields(),
    passwordCollected: initial?.passwordCollected ?? false,
    turnIndex: initial?.turnIndex ?? 0,
    updatedAt: Date.now(),
  };
  store.set(sessionId, created);
  return created;
}

export function appendRegistrationTurn(
  sessionId: string,
  input: {
    fields: RegistrationFields;
    passwordCollected: boolean;
    turnIndex: number;
  },
): RegistrationAgentSession {
  const session = touchRegistrationSession(sessionId);
  session.fields = input.fields;
  session.passwordCollected = input.passwordCollected;
  session.turnIndex = input.turnIndex;
  session.updatedAt = Date.now();
  return session;
}

export function priorFieldsFromSession(
  sessionId: string | undefined,
  formSession?: { name?: string; email?: string; password?: string },
): RegistrationFields | undefined {
  const fromStore = sessionId ? getRegistrationSession(sessionId) : null;
  if (fromStore?.fields.name || fromStore?.fields.email) {
    return fromStore.fields;
  }

  if (!formSession) return undefined;
  const name = formSession.name?.trim() ?? "";
  const email = formSession.email?.trim() ?? "";
  if (!name && !email) return undefined;
  return { name, email };
}

/** Test-only */
export function resetRegistrationSessionsForTests() {
  store.clear();
}
