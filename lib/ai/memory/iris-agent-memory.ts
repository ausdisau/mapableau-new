/**
 * Iris Redis Agent Memory adapter (ported from Redis Iris conversational template).
 *
 * Purpose-bound: session turns + long-term **non-clinical** facts only.
 * No health notes / support notes by default.
 * Tenant + participant scoped session ids.
 * Fail soft if memory API is down.
 *
 * Flag: MAPABLE_IRIS_AGENT_MEMORY_ENABLED (default false)
 * Env: AGENT_MEMORY_URL, STORE_ID, AGENT_MEMORY_API_KEY
 */

const MAX_LONG_TERM_RESULTS = 5;
const MAX_SESSION_EVENTS = 12;

export function isIrisAgentMemoryEnabled(): boolean {
  return process.env.MAPABLE_IRIS_AGENT_MEMORY_ENABLED === "true";
}

export function isIrisAgentMemoryConfigured(): boolean {
  return Boolean(
    process.env.AGENT_MEMORY_URL &&
      process.env.STORE_ID &&
      process.env.AGENT_MEMORY_API_KEY,
  );
}

export type IrisMemoryClientOptions = {
  tenantId: string;
  participantId: string;
  sessionId?: string;
  actorId?: string;
};

export type IrisMemoryBundle = {
  enabled: boolean;
  sessionId: string;
  longTermFacts: string[];
  recentEvents: Array<{ role: string; text: string }>;
  sessionSummary: string | null;
  /** Snippets safe to inject into Agents SDK context (already length-bounded). */
  snippets: string[];
};

function scopedSessionId(opts: IrisMemoryClientOptions): string {
  const base =
    opts.sessionId?.trim() ||
    `sess-${opts.tenantId.slice(0, 8)}-${opts.participantId.slice(0, 8)}`;
  return `mapable:${opts.tenantId}:${opts.participantId}:${base}`.slice(0, 200);
}

async function memoryRequest(
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown | null> {
  const baseUrl = (process.env.AGENT_MEMORY_URL || "").replace(/\/$/, "");
  const storeId = process.env.STORE_ID;
  const apiKey = process.env.AGENT_MEMORY_API_KEY;
  if (!baseUrl || !storeId || !apiKey) {
    throw new Error("IRIS_AGENT_MEMORY_NOT_CONFIGURED");
  }

  const res = await fetch(`${baseUrl}/v1/stores/${storeId}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IRIS_AGENT_MEMORY_${method}_${res.status}:${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Load session + long-term memory for a turn. Returns empty snippets when
 * disabled, unconfigured, or on soft failure.
 */
export async function loadIrisMemoryForTurn(input: {
  tenantId: string;
  participantId: string;
  sessionId?: string;
  query: string;
  actorId?: string;
}): Promise<IrisMemoryBundle> {
  const sessionId = scopedSessionId(input);

  if (!isIrisAgentMemoryEnabled() || !isIrisAgentMemoryConfigured()) {
    return {
      enabled: false,
      sessionId,
      longTermFacts: [],
      recentEvents: [],
      sessionSummary: null,
      snippets: [],
    };
  }

  try {
    const [search, session] = await Promise.all([
      memoryRequest("POST", "/long-term-memory/search", {
        text: input.query.slice(0, 1000),
      }),
      memoryRequest("GET", `/session-memory/${encodeURIComponent(sessionId)}`),
    ]);

    const searchObj = (search ?? {}) as {
      items?: Array<{ text?: string }>;
    };
    const longTermFacts = (searchObj.items ?? [])
      .map((i) => (i.text ?? "").trim())
      .filter(Boolean)
      .slice(0, MAX_LONG_TERM_RESULTS)
      // Soft filter: drop obviously clinical/support-note shaped content
      .filter((t) => !/\b(diagnosis|medication|clinical|support note)\b/i.test(t));

    const sessionObj = (session ?? {}) as {
      summary?: string;
      events?: Array<{ role?: string; text?: string; content?: string }>;
    };
    const recentEvents = (sessionObj.events ?? [])
      .slice(-MAX_SESSION_EVENTS)
      .map((e) => ({
        role: e.role ?? "unknown",
        text: (e.text ?? e.content ?? "").slice(0, 400),
      }))
      .filter((e) => e.text.length > 0);

    const sessionSummary = sessionObj.summary?.slice(0, 800) ?? null;

    const snippets: string[] = [];
    if (sessionSummary) snippets.push(`Summary: ${sessionSummary}`);
    for (const fact of longTermFacts) {
      snippets.push(`Fact: ${fact.slice(0, 240)}`);
    }
    for (const ev of recentEvents.slice(-4)) {
      snippets.push(`${ev.role}: ${ev.text.slice(0, 160)}`);
    }

    return {
      enabled: true,
      sessionId,
      longTermFacts,
      recentEvents,
      sessionSummary,
      snippets: snippets.slice(0, 12),
    };
  } catch {
    // Fail soft — memory must not block Navigator/Access.
    return {
      enabled: true,
      sessionId,
      longTermFacts: [],
      recentEvents: [],
      sessionSummary: null,
      snippets: [],
    };
  }
}

/**
 * Persist a user + assistant turn into Iris session memory. Fail soft.
 */
export async function appendIrisSessionTurn(input: {
  tenantId: string;
  participantId: string;
  sessionId?: string;
  actorId?: string;
  userText: string;
  assistantText: string;
}): Promise<{ ok: boolean }> {
  if (!isIrisAgentMemoryEnabled() || !isIrisAgentMemoryConfigured()) {
    return { ok: false };
  }

  const sessionId = scopedSessionId(input);
  const actorId = input.actorId ?? input.participantId;

  try {
    await memoryRequest("POST", `/session-memory/${encodeURIComponent(sessionId)}/events`, {
      events: [
        {
          role: "user",
          actorId,
          text: input.userText.slice(0, 2000),
        },
        {
          role: "assistant",
          actorId: "mapable-navigator",
          text: input.assistantText.slice(0, 2000),
        },
      ],
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
