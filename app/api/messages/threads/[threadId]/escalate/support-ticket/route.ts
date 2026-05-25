import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { canEscalateThread } from "@/lib/messages/message-access-policy";
import { escalateThreadToSupportDesk } from "@/lib/messages/message-report-service";
import { escalateSchema } from "@/lib/validation/messages";
import { buildViewerContext } from "@/lib/messages/message-access-policy";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { threadId } = await params;
  const viewer = await buildViewerContext({
    profileId: user.id,
    primaryRole: user.primaryRole,
    roles: user.roles,
  });
  if (!(await canEscalateThread(threadId, viewer, "support"))) {
    return jsonError("You cannot escalate this conversation to support.", 403);
  }

  const body = await req.json().catch(() => ({}));
  const parsed = escalateSchema.safeParse(body);

  const ticket = await escalateThreadToSupportDesk({
    threadId,
    actor: user,
    title: parsed.success ? parsed.data.title : undefined,
    description: parsed.success ? parsed.data.description : undefined,
  });

  return jsonOk({ ticket }, 201);
}
