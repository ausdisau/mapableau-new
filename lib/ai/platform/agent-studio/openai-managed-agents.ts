import { z } from "zod";

import {
  mapAbleAgentStudioAgentIdSchema,
  mapAbleAgentStudioSessionIdSchema,
} from "./contracts";

const OPENAI_API_ORIGIN = "https://api.openai.com/v1";

const managedAgentSchema = z
  .object({
    id: z.string(),
    name: z.string().nullable().optional(),
    model: z.string(),
    created_at: z.number().optional(),
    updated_at: z.number().optional(),
  })
  .passthrough();

const managedSessionSchema = z
  .object({
    id: z.string(),
    status: z
      .enum(["idle", "in_progress", "requires_action", "failed"])
      .optional(),
    created_at: z.number().optional(),
    last_active_at: z.number().optional(),
    error: z.string().nullable().optional(),
    required_actions: z.array(z.unknown()).optional(),
  })
  .passthrough();

const cursorPageSchema = z
  .object({
    data: z.array(z.unknown()).default([]),
    has_more: z.boolean().optional(),
    first_id: z.string().nullable().optional(),
    last_id: z.string().nullable().optional(),
  })
  .passthrough();

export class MapAbleManagedAgentsApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "MapAbleManagedAgentsApiError";
    this.status = status;
  }
}

function requestHeaders(): HeadersInit {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new MapAbleManagedAgentsApiError(
      503,
      "OpenAI Agents API is not configured.",
    );
  }

  const projectId = process.env.OPENAI_PROJECT_ID?.trim();

  return {
    Authorization: "Bearer " + key,
    "Content-Type": "application/json",
    "OpenAI-Beta": "agents=v1",
    ...(projectId ? { "OpenAI-Project": projectId } : {}),
  };
}

function extractSafeError(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload
  ) {
    const error = (payload as { error?: unknown }).error;
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      return (error as { message: string }).message;
    }
  }
  return "OpenAI Agents API request failed.";
}

async function requestJson(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const response = await fetch(OPENAI_API_ORIGIN + path, {
    ...init,
    headers: {
      ...requestHeaders(),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: { message: "OpenAI returned a non-JSON response." } };
    }
  }

  if (!response.ok) {
    throw new MapAbleManagedAgentsApiError(
      response.status,
      extractSafeError(payload),
    );
  }

  return payload;
}

export async function createManagedMapAbleAgent(config: object) {
  const payload = await requestJson("/agents", {
    method: "POST",
    body: JSON.stringify(config),
  });
  return managedAgentSchema.parse(payload);
}

export async function createManagedMapAbleSession(input: {
  agentId: string;
  initialInput: string;
}) {
  const agentId = mapAbleAgentStudioAgentIdSchema.parse(input.agentId);
  const payload = await requestJson("/agents/sessions", {
    method: "POST",
    body: JSON.stringify({
      agent_id: agentId,
      environment: { type: "none" },
      input: input.initialInput,
      stream: false,
      metadata: {
        app: "mapable-care-agent-studio",
        data_classification: "synthetic_or_deidentified",
      },
    }),
  });

  return managedSessionSchema.parse(payload);
}

export async function listManagedMapAbleSessions(agentId: string) {
  const safeAgentId = mapAbleAgentStudioAgentIdSchema.parse(agentId);
  const payload = await requestJson(
    "/agents/sessions?agent_id=" +
      encodeURIComponent(safeAgentId) +
      "&limit=50&order=desc",
  );
  const page = cursorPageSchema.parse(payload);

  return {
    ...page,
    data: page.data.map((item) => managedSessionSchema.parse(item)),
  };
}

export async function getManagedMapAbleSession(sessionId: string) {
  const safeSessionId = mapAbleAgentStudioSessionIdSchema.parse(sessionId);
  const payload = await requestJson(
    "/agents/sessions/" + encodeURIComponent(safeSessionId),
  );

  return managedSessionSchema.parse(payload);
}

export async function listManagedMapAbleSessionItems(sessionId: string) {
  const safeSessionId = mapAbleAgentStudioSessionIdSchema.parse(sessionId);
  const payload = await requestJson(
    "/agents/sessions/" +
      encodeURIComponent(safeSessionId) +
      "/items?limit=100&order=asc",
  );

  return cursorPageSchema.parse(payload);
}

export async function sendManagedMapAbleSessionMessage(input: {
  sessionId: string;
  message: string;
}) {
  const safeSessionId = mapAbleAgentStudioSessionIdSchema.parse(
    input.sessionId,
  );

  await requestJson(
    "/agents/sessions/" + encodeURIComponent(safeSessionId) + "/events",
    {
      method: "POST",
      body: JSON.stringify({
        events: [
          {
            type: "agent.session.input.message",
            input: [
              {
                role: "user",
                content: [{ type: "input_text", text: input.message }],
              },
            ],
          },
        ],
        idempotency_key: crypto.randomUUID(),
      }),
    },
  );

  return { accepted: true as const };
}
