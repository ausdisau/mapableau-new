import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  classifySupportCategory,
  SupportClassifierNotConfiguredError,
} from "@/lib/mapable-llm/support-classifier/classifySupportCategory";
import { z } from "zod";

export const runtime = "nodejs";

const classifySupportBodySchema = z.object({
  text: z.string().min(1).max(4000),
  correlationId: z.string().max(128).optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = classifySupportBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await classifySupportCategory({
      text: parsed.data.text,
      correlationId: parsed.data.correlationId ?? user.id,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof SupportClassifierNotConfiguredError) {
      return jsonError(
        "Support classification is not configured. Set OPENAI_API_KEY on the server.",
        503
      );
    }
    const message =
      e instanceof Error ? e.message : "Classification failed";
    return jsonError(message, 500);
  }
}
