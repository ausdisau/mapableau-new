import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { resolvePhraseText } from "@/lib/aac/aac-phrase-service";
import { canSendInThread, buildViewerContext } from "@/lib/messages/message-access-policy";
import { sendMessage } from "@/lib/messages/message-service";
import { aacSpeakSchema } from "@/lib/validation/aac";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { threadId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = aacSpeakSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Choose a phrase to send.", 400);
  }

  const viewer = await buildViewerContext({
    profileId: user.id,
    primaryRole: user.primaryRole,
    roles: user.roles,
  });
  if (!(await canSendInThread(threadId, viewer))) {
    return jsonError("You cannot send messages in this conversation.", 403);
  }

  try {
    const text = await resolvePhraseText(
      user.id,
      parsed.data.phraseId,
      parsed.data.phrase
    );
    const message = await sendMessage({
      threadId,
      sender: user,
      body: text,
      messageType: "text",
      metadataJson: { source: "aac", phraseId: parsed.data.phraseId },
    });
    return jsonOk({ message, phrase: text }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg === "PHRASE_NOT_FOUND") {
      return jsonError("Phrase not found.", 404);
    }
    return jsonError("Could not send phrase.", 500);
  }
}
