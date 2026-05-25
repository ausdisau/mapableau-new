import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { blockUser } from "@/lib/messages/thread-service";
import { blockUserSchema } from "@/lib/validation/messages";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = blockUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Please choose who to block.", 400);
  }

  if (parsed.data.blockedProfileId === user.id) {
    return jsonError("You cannot block yourself.", 400);
  }

  await blockUser(user.id, parsed.data.blockedProfileId);
  return jsonOk({ ok: true });
}
