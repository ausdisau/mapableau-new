import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  mapAbleAgentStudioAgentIdSchema,
  mapAbleAgentStudioCreateSessionSchema,
} from "@/lib/ai/platform/agent-studio/contracts";
import {
  MapAbleManagedAgentsApiError,
  createManagedMapAbleSession,
  listManagedMapAbleSessions,
} from "@/lib/ai/platform/agent-studio/openai-managed-agents";
import { isMapAbleAgentStudioEnabled } from "@/lib/ai/platform/agent-studio/profile";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  if (!isMapAbleAgentStudioEnabled()) {
    return jsonError("MapAble Agent Studio is disabled.", 503);
  }

  const url = new URL(request.url);
  const parsedAgentId = mapAbleAgentStudioAgentIdSchema.safeParse(
    url.searchParams.get("agentId"),
  );
  if (!parsedAgentId.success) return zodErrorResponse(parsedAgentId.error);

  try {
    const sessions = await listManagedMapAbleSessions(parsedAgentId.data);
    return jsonOk(sessions);
  } catch (error) {
    if (error instanceof MapAbleManagedAgentsApiError) {
      return jsonError(
        error.message,
        error.status >= 400 && error.status < 500 ? error.status : 503,
      );
    }
    console.error("[agent-studio:list-sessions]", error);
    return jsonError("Unable to list managed agent sessions.", 503);
  }
}

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  if (!isMapAbleAgentStudioEnabled()) {
    return jsonError("MapAble Agent Studio is disabled.", 503);
  }

  const parsed = mapAbleAgentStudioCreateSessionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const session = await createManagedMapAbleSession({
      agentId: parsed.data.agentId,
      initialInput: parsed.data.initialInput,
    });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: "ai.agent_studio.session_created",
      entityType: "OpenAIAgentSession",
      entityId: session.id,
      metadata: {
        agentId: parsed.data.agentId,
        inputLength: parsed.data.initialInput.length,
        dataClassification: parsed.data.dataClassification,
      },
    });

    return jsonOk({ session }, 201);
  } catch (error) {
    if (error instanceof MapAbleManagedAgentsApiError) {
      return jsonError(
        error.message,
        error.status >= 400 && error.status < 500 ? error.status : 503,
      );
    }
    console.error("[agent-studio:create-session]", error);
    return jsonError("Unable to create the managed agent session.", 503);
  }
}
