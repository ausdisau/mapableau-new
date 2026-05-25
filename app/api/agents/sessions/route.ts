import { buildAgentContext } from "@/lib/agents/agent-context";
import { agentErrorResponse } from "@/lib/agents/api-utils";
import type { MapAbleAgentId } from "@/lib/agents/agent-types";
import { requireApiSession } from "@/lib/api/auth-handler";
import { assertAgentsEnabled } from "@/lib/config/agents";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    assertAgentsEnabled();
    const user = await requireApiSession();
    if (user instanceof Response) return user;

    const conversations = await prisma.agentConversation.findMany({
      where: { userId: user.id, status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        agentId: true,
        title: true,
        updatedAt: true,
      },
    });
    return Response.json({ conversations });
  } catch (error) {
    return agentErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    assertAgentsEnabled();
    const user = await requireApiSession();
    if (user instanceof Response) return user;

    const body = await req.json().catch(() => ({}));
    const context = await buildAgentContext(user);
    const agentId = (body?.agentId ?? "participant_support") as MapAbleAgentId;
    const title =
      typeof body?.title === "string" ? body.title : "New conversation";

    const conversation = await prisma.agentConversation.create({
      data: {
        userId: user.id,
        profileId: context.profileId,
        agentId,
        title,
      },
    });

    return Response.json({ conversation }, { status: 201 });
  } catch (error) {
    return agentErrorResponse(error);
  }
}
