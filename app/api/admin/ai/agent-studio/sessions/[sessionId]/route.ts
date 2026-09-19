import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  mapAbleAgentStudioMessageSchema,
  mapAbleAgentStudioSessionIdSchema,
} from "@/lib/ai/platform/agent-studio/contracts";
import {
  MapAbleManagedAgentsApiError,
  getManagedMapAbleSession,
  listManagedMapAbleSessionItems,
  sendManagedMapAbleSessionMessage,
} from "@/lib/ai/platform/agent-studio/openai-managed-agents";
import { isMapAbleAgentStudioEnabled } from "@/lib/ai/platform/agent-studio/profile";

export const runtime = "nodejs";

async function requireSessionId(
  params: Promise<{ sessionId: string }>,
): Promise<string | Response> {
  const { sessionId } = await params;
  const parsed = mapAbleAgentStudioSessionIdSchema.safeParse(sessionId);
  return parsed.success ? parsed.data : zodErrorResponse(parsed.error);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  if (!isMapAbleAgentStudioEnabled()) {
    return jsonError("MapAble Agent Studio is disabled.", 503);
  }

  const sessionId = await requireSessionId(params);
  if (sessionId instanceof Response) return sessionId;

  try {
    const [session, items] = await Promise.all([
      getManagedMapAbleSession(sessionId),
      listManagedMapAbleSessionItems(sessionId),
    ]);
    return jsonOk({ session, items });
  } catch (error) {
    if (error instanceof MapAbleManagedAgentsApiError) {
      return jsonError(
        error.message,
        error.status >= 400 && error.status < 500 ? error.status : 503,
      );
    }
    console.error("[agent-studio:get-session]", error);
    return jsonError("Unable to load the managed agent session.", 503);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  if (!isMapAbleAgentStudioEnabled()) {
    return jsonError("MapAble Agent Studio is disabled.", 503);
  }

  const sessionId = await requireSessionId(params);
  if (sessionId instanceof Response) return sessionId;

  const parsed = mapAbleAgentStudioMessageSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await sendManagedMapAbleSessionMessage({
      sessionId,
      message: parsed.data.message,
    });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: "ai.agent_studio.session_message_submitted",
      entityType: "OpenAIAgentSession",
      entityId: sessionId,
      metadata: {
        inputLength: parsed.data.message.length,
        dataClassification: parsed.data.dataClassification,
      },
    });

    return jsonOk(result, 202);
  } catch (error) {
    if (error instanceof MapAbleManagedAgentsApiError) {
      return jsonError(
        error.message,
        error.status >= 400 && error.status < 500 ? error.status : 503,
      );
    }
    console.error("[agent-studio:message]", error);
    return jsonError("Unable to send the managed agent message.", 503);
  }
}
