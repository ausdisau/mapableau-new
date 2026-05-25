import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { muteThread } from "@/lib/messages/thread-service";
import { buildViewerContext, canViewThread } from "@/lib/messages/message-access-policy";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { threadId } = await params;
  const thread = await prisma.communicationThread.findUnique({
    where: { id: threadId },
  });
  if (!thread) return jsonError("Conversation not found.", 404);

  const viewer = await buildViewerContext({
    profileId: user.id,
    primaryRole: user.primaryRole,
    roles: user.roles,
  });
  if (!(await canViewThread(thread, viewer))) {
    return jsonError("You cannot mute this conversation.", 403);
  }

  await muteThread(threadId, user.id);
  return jsonOk({ ok: true });
}
