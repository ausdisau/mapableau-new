import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { buildViewerContext, canEscalateThread } from "@/lib/messages/message-access-policy";
import { escalateThreadToIncidentDraft } from "@/lib/messages/message-report-service";
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
  if (!(await canEscalateThread(threadId, viewer, "incident"))) {
    return jsonError("You cannot escalate this conversation for safety review.", 403);
  }

  const body = await req.json().catch(() => ({}));
  const parsed = escalateSchema.safeParse(body);

  const incident = await escalateThreadToIncidentDraft({
    threadId,
    actor: user,
    description: parsed.success ? parsed.data.description : undefined,
  });

  return jsonOk({ incident }, 201);
}
