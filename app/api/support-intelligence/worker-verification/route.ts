import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { enqueueHumanReview } from "@/lib/support-intelligence/human-review";
import { lookupWorkerVerification } from "@/lib/support-intelligence/worker-verification/gateway";

export const runtime = "nodejs";

const bodySchema = z.object({
  workerProfileId: z.string().min(1).max(128),
  internalScreeningStatus: z.string().max(64).nullable().optional(),
  identityTokens: z.array(z.string().max(80)).max(8).optional(),
  actorUserId: z.string().min(1).max(128),
  consentGranted: z.boolean(),
  consentWithdrawn: z.boolean().optional(),
});

/**
 * POST /api/support-intelligence/worker-verification
 * Authorised, consent-gated screening workflow — no external DB crawl.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(`si-wvg:${ip}`, { windowMs: 60_000, max: 10 })) {
    return Response.json({ error: "Rate limit reached." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid verification request." }, { status: 400 });
  }

  const result = await lookupWorkerVerification(parsed.data);
  if (result.ok && result.humanReviewRequired) {
    enqueueHumanReview({
      reasons: result.humanReviewReasons,
      entityType: "WorkerProfile",
      entityId: parsed.data.workerProfileId,
      actorUserId: parsed.data.actorUserId,
    });
  }

  const status = result.ok
    ? 200
    : result.reasonCode === "consent_missing" ||
        result.reasonCode === "consent_withdrawn"
      ? 403
      : 403;

  return Response.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
