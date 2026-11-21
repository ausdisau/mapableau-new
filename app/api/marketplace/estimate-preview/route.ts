import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, zodErrorResponse } from "@/lib/api/response";
import { isMarketplaceSurfaceEnabled } from "@/lib/config/year-one-scope";
import { previewMarketEstimate } from "@/packages/marketplace-inclusive/src/index";

export const runtime = "nodejs";

const requestSchema = z.object({
  lines: z.array(z.object({
    id: z.string().regex(/^demo-[a-z-]+$/),
    quantity: z.number().int().min(1).max(5),
  }).strict()).min(1).max(8),
}).strict();

/**
 * Authenticated, non-persistent pricing PREVIEW.
 * The client NEVER submits prices or funding codes. Server fixture IDs alone
 * determine the non-binding example amounts. This is NOT checkout.
 */
export async function POST(req: Request): Promise<Response> {
  if (!isMarketplaceSurfaceEnabled()) return jsonError("Not found", 404);

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    return jsonError("Cross-origin requests are not permitted", 403);
  if (!(req.headers.get("content-type") ?? "").includes("application/json"))
    return jsonError("Expected JSON request", 415);
  const length = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 8192)
    return jsonError("Request too large", 413);

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 8192) return jsonError("Request too large", 413);
    body = JSON.parse(raw);
  } catch {
    return jsonError("Malformed JSON", 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const preview = previewMarketEstimate(parsed.data.lines);
    return Response.json({ preview, simulationOnly: true }, {
      status: 200,
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid selection", 422);
  }
}
