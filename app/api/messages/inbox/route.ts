import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { getInbox } from "@/lib/messages/thread-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "message:read")) {
    return jsonError("You do not have permission to read messages.", 403);
  }

  try {
    const inbox = await getInbox(user.id, user);
    return jsonOk({ inbox });
  } catch {
    return jsonError("Could not load your inbox. Try again shortly.", 500);
  }
}
