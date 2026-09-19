import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  MapAbleManagedAgentsApiError,
  createManagedMapAbleAgent,
} from "@/lib/ai/platform/agent-studio/openai-managed-agents";
import {
  buildMapAbleCareHostedAgentConfig,
  isMapAbleAgentStudioEnabled,
} from "@/lib/ai/platform/agent-studio/profile";
import { mapAbleAgentStudioCreateAgentSchema } from "@/lib/ai/platform/agent-studio/contracts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  if (!isMapAbleAgentStudioEnabled()) {
    return jsonError("MapAble Agent Studio is disabled.", 503);
  }

  const parsed = mapAbleAgentStudioCreateAgentSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const config = buildMapAbleCareHostedAgentConfig(parsed.data);
    const agent = await createManagedMapAbleAgent(config);

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: "ai.agent_studio.agent_created",
      entityType: "OpenAIManagedAgent",
      entityId: agent.id,
      metadata: {
        capability: config.metadata.mapable_capability,
        version: config.metadata.mapable_version,
        model: config.model,
        authority: config.metadata.mapable_authority,
        hostedToolCount: config.tools.length,
      },
    });

    return jsonOk(
      {
        agent: {
          id: agent.id,
          name: agent.name,
          model: agent.model,
          createdAt: agent.created_at ?? null,
        },
        governance: {
          authority: "A0-A3",
          hostedTools: 0,
          dataClassification: "synthetic_or_deidentified",
        },
      },
      201,
    );
  } catch (error) {
    if (error instanceof MapAbleManagedAgentsApiError) {
      return jsonError(
        error.message,
        error.status >= 400 && error.status < 500 ? error.status : 503,
      );
    }
    console.error("[agent-studio:create-agent]", error);
    return jsonError("Unable to create the managed MapAble agent.", 503);
  }
}
