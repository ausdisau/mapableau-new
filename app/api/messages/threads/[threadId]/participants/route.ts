import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { addParticipantsSchema } from "@/lib/validation/messages";
import { buildViewerContext, canViewThread } from "@/lib/messages/message-access-policy";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { threadId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = addParticipantsSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Participant details are not valid.", 400);
  }

  const thread = await prisma.communicationThread.findUnique({
    where: { id: threadId },
  });
  if (!thread) return jsonError("Conversation not found.", 404);
  if (thread.threadType !== "group" && thread.threadType !== "provider_team") {
    return jsonError("Participants can only be added to group conversations.", 400);
  }

  const viewer = await buildViewerContext({
    profileId: user.id,
    primaryRole: user.primaryRole,
    roles: user.roles,
  });
  if (!(await canViewThread(thread, viewer))) {
    return jsonError("You cannot change participants in this conversation.", 403);
  }

  for (const p of parsed.data.participants) {
    await prisma.communicationThreadParticipant.upsert({
      where: {
        threadId_profileId: { threadId, profileId: p.profileId },
      },
      create: {
        threadId,
        profileId: p.profileId,
        role: p.role,
        displayName: p.displayName,
        canSend: p.canSend ?? true,
        canAttachFiles: p.canAttachFiles ?? true,
      },
      update: {
        leftAt: null,
        role: p.role,
        displayName: p.displayName,
      },
    });
  }

  return jsonOk({ ok: true }, 201);
}
