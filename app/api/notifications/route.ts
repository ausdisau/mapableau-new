import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listNotificationsForUser } from "@/lib/notifications/notification-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const notifications = await listNotificationsForUser(user.id, {
    unreadOnly,
  });

  return jsonOk({ notifications });
}
