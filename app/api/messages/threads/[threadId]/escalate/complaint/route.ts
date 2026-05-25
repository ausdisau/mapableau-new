import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { buildViewerContext, canEscalateThread } from "@/lib/messages/message-access-policy";
import { escalateThreadToComplaint } from "@/lib/messages/message-report-service";
import { escalateSchema } from "@/lib/validation/messages";

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
  if (!(await canEscalateThread(threadId, viewer, "complaint"))) {
    return jsonError("You cannot escalate this conversation as a complaint.", 403);
  }

  const body = await req.json().catch(() => ({}));
  const parsed = escalateSchema.safeParse(body);

  const thread = await escalateThreadToComplaint({
    threadId,
    actor: user,
    description: parsed.success ? parsed.data.description : undefined,
  });

  return jsonOk({ thread }, 201);
}
