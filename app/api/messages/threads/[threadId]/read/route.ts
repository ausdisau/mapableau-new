import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { markThreadRead } from "@/lib/messages/message-receipt-service";
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
    return jsonError("You cannot update read status for this conversation.", 403);
  }

  await markThreadRead(threadId, user.id);
  return jsonOk({ ok: true });
}
