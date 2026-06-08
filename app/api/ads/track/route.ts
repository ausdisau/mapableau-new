import { trackAdEventSchema } from "@/lib/ads/schemas";
import { trackAdEvent } from "@/lib/ads/tracking-service";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = trackAdEventSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await trackAdEvent(parsed.data);
  if (!result.ok) {
    return jsonError(result.error ?? "Track failed", 400);
  }

  return jsonOk({ recorded: true });
}
