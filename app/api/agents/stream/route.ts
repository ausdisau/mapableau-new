import { buildAgentContext } from "@/lib/agents/agent-context";
import { streamMapableAgent } from "@/lib/agents/agent-runner";
import { agentErrorResponse } from "@/lib/agents/api-utils";
import type { AgentRunRequest, MapAbleAgentId } from "@/lib/agents/agent-types";
import { requireApiSession } from "@/lib/api/auth-handler";
import { assertAgentsEnabled } from "@/lib/config/agents";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    assertAgentsEnabled();
    const user = await requireApiSession();
    if (user instanceof Response) return user;

    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message : "";
    if (!message.trim()) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const context = await buildAgentContext(user, body?.sessionId);
    const request: AgentRunRequest = {
      agentId: body?.agentId as MapAbleAgentId | undefined,
      message,
      context,
      conversationId: body?.conversationId,
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of streamMapableAgent(request)) {
            controller.enqueue(
              encoder.encode(`${JSON.stringify(event)}\n`)
            );
          }
        } catch (e) {
          const err = e instanceof Error ? e.message : "Stream failed";
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "error", message: err }) + "\n")
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return agentErrorResponse(error);
  }
}
