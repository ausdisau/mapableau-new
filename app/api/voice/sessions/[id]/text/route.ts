import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createTranscriptFromText } from "@/lib/voice/voice-text-fallback-service";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(20000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400);
  }

  try {
    const transcript = await createTranscriptFromText({
      sessionId: id,
      userId: user.id,
      text: parsed.data.text,
    });
    return jsonOk({ transcript }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    throw e;
  }
}
