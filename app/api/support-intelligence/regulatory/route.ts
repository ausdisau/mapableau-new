import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { enqueueHumanReview } from "@/lib/support-intelligence/human-review";
import { lookupRegulatoryEvidence } from "@/lib/support-intelligence/regulatory/gateway";

export const runtime = "nodejs";

const schema = z.object({
  abn: z.string().max(20).optional(),
  providerName: z.string().max(200).optional(),
  directoryActive: z.union([z.string(), z.boolean(), z.number()]).optional(),
  sourceDate: z.string().max(40).optional(),
});

/**
 * GET /api/support-intelligence/regulatory
 * Session-required evidence lookup. Human-review enqueue is authenticated-only
 * so anonymous callers cannot flood the safeguarding queue.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(`si-reg:${ip}`, { windowMs: 60_000, max: 30 })) {
    return Response.json({ error: "Rate limit reached." }, { status: 429 });
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const params = new URL(request.url).searchParams;
  const parsed = schema.safeParse({
    abn: params.get("abn") || undefined,
    providerName: params.get("providerName") || undefined,
    directoryActive: params.get("directoryActive") || undefined,
    sourceDate: params.get("sourceDate") || undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid regulatory query." }, { status: 400 });
  }

  const result = await lookupRegulatoryEvidence({
    ...parsed.data,
    actorUserId: user.id,
  });

  if (result.ok && result.humanReviewRequired) {
    await enqueueHumanReview({
      reasons: result.humanReviewReasons,
      entityType: "Provider",
      entityId: parsed.data.abn ?? parsed.data.providerName ?? "unknown",
      actorUserId: user.id,
    });
  }

  return Response.json(result, {
    status: result.ok ? 200 : 403,
    headers: { "Cache-Control": "no-store" },
  });
}
