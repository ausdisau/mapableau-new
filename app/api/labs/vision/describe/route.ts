import { z } from "zod";

import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, zodErrorResponse } from "@/lib/api/response";
import {
  LabsHfConfigError,
  LabsHfUpstreamError,
  streamLabsVisionDescribe,
} from "@/lib/labs/hf";

export const runtime = "nodejs";

const bodySchema = z.object({
  prompt: z.string().max(500).optional(),
  imageUrl: z.string().min(8).max(2_000_000),
});

/**
 * Labs-only streaming vision describe via Hugging Face Router.
 * Does not write GAIS evidence and is not used by Mobility Futures decisions.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req, 2_100_000);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const stream = await streamLabsVisionDescribe({
      prompt: parsed.data.prompt,
      imageUrl: parsed.data.imageUrl,
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Labs-Simulation-Data": "true",
        "X-Labs-Hf-Vision": "1",
      },
    });
  } catch (e) {
    if (e instanceof LabsHfConfigError) {
      return jsonError(e.message, 503);
    }
    if (e instanceof LabsHfUpstreamError) {
      return jsonError(e.message, e.status >= 400 && e.status < 600 ? e.status : 502);
    }
    throw e;
  }
}
