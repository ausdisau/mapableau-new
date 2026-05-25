import { agentErrorResponse } from "@/lib/agents/api-utils";
import { requireApiSession } from "@/lib/api/auth-handler";
import { assertAgentsEnabled } from "@/lib/config/agents";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    assertAgentsEnabled();
    const user = await requireApiSession();
    if (user instanceof Response) return user;

    const { id } = await params;
    const conversation = await prisma.agentConversation.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 100 },
        runs: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!conversation) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ conversation });
  } catch (error) {
    return agentErrorResponse(error);
  }
}
