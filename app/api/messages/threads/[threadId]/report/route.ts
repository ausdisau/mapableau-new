import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { reportMessage } from "@/lib/messages/message-report-service";
import { reportThreadSchema } from "@/lib/validation/messages";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { threadId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = reportThreadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Please choose a report reason.", 400);
  }

  try {
    const report = await reportMessage({
      threadId,
      reporter: user,
      reason: parsed.data.reason,
      messageId: parsed.data.messageId,
      details: parsed.data.details,
    });
    return jsonOk({ report }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("You cannot report this conversation.", 403);
    }
    return jsonError("Your report could not be saved. Try again.", 500);
  }
}
