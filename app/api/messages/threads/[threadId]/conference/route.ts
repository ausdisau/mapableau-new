import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getActiveConference,
  startConference,
} from "@/lib/conference/conference-service";
import { startConferenceSchema } from "@/lib/validation/conference";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { threadId } = await params;
  const session = await getActiveConference(threadId, user);
  return jsonOk({ session });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { threadId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = startConferenceSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Please choose audio or video for the call.", 400);
  }

  try {
    const session = await startConference({
      threadId,
      mode: parsed.data.mode,
      user,
    });
    return jsonOk({ session }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg === "FORBIDDEN") {
      return jsonError("You cannot start a call in this conversation.", 403);
    }
    if (msg === "THREAD_NOT_FOUND") {
      return jsonError("Conversation not found.", 404);
    }
    return jsonError("Could not start the call. Try again shortly.", 500);
  }
}
