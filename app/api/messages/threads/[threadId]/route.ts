import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { getThread } from "@/lib/messages/thread-service";
import {
  getParticipantSummaries,
  getThreadContextLinks,
} from "@/lib/messages/thread-context-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "message:read")) {
    return jsonError("You do not have permission to read messages.", 403);
  }

  const { threadId } = await params;
  const result = await getThread(threadId, user);
  if (!result) {
    return jsonError("This conversation was not found or you cannot open it.", 404);
  }

  const [context, participants] = await Promise.all([
    getThreadContextLinks(threadId),
    getParticipantSummaries(threadId),
  ]);

  return jsonOk({
    thread: result.thread,
    messages: result.messages,
    context,
    participants,
  });
}
