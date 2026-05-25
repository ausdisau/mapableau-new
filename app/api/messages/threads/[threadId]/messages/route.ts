import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { sendMessage } from "@/lib/messages/message-service";
import { sendMessageSchema } from "@/lib/validation/messages";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "message:send")) {
    return jsonError("You do not have permission to send messages.", 403);
  }

  const { threadId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Please enter a message before sending.", 400);
  }

  try {
    const message = await sendMessage({
      threadId,
      sender: user,
      body: parsed.data.body,
      messageType: parsed.data.messageType,
      attachmentDocumentIds: parsed.data.attachmentDocumentIds,
      metadataJson: parsed.data.metadataJson,
    });
    return jsonOk({ message }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg === "FORBIDDEN") {
      return jsonError("You cannot send messages in this conversation.", 403);
    }
    if (msg === "ATTACHMENT_FORBIDDEN") {
      return jsonError("You do not have permission to attach that document.", 403);
    }
    if (msg === "EMPTY_MESSAGE") {
      return jsonError("Please enter a message before sending.", 400);
    }
    return jsonError("Your message could not be sent. Try again.", 500);
  }
}
