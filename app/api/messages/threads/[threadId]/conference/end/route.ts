import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { endConference } from "@/lib/conference/conference-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { threadId } = await params;

  try {
    await endConference({ threadId, user });
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("You cannot end this call.", 403);
    }
    return jsonError("Could not end the call.", 500);
  }
}
