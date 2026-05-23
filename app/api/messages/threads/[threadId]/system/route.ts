import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  sendSystemMessageToThread,
  userCanAccessConversation,
} from "@/lib/messages/message-service";

const schema = z.object({
  body: z.string().min(1).max(10000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!isAdminRole(user.primaryRole)) {
    return jsonError("Internal only", 403);
  }

  const { threadId } = await params;

  if (!(await userCanAccessConversation(user.id, threadId, true))) {
    return jsonError("Forbidden", 403);
  }

  try {
    const parsed = schema.parse(await req.json());
    const message = await sendSystemMessageToThread({
      conversationId: threadId,
      senderUserId: user.id,
      body: parsed.body,
    });
    return jsonOk({ message }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("System message failed", 500);
  }
}
