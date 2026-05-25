import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { listConversationsForUser } from "@/lib/messages/message-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const conversations = await listConversationsForUser(
    user.id,
    isAdminRole(user.primaryRole)
  );
  return jsonOk({ inbox: conversations });
}
