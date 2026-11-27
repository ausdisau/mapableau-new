import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { apiForbidden } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { enqueueHumanReview } from "@/lib/support-intelligence/human-review";
import { lookupWorkerVerification } from "@/lib/support-intelligence/worker-verification/gateway";

export const runtime = "nodejs";

const bodySchema = z.object({
  workerProfileId: z.string().min(1).max(128),
  identityTokens: z.array(z.string().max(80)).max(8).optional(),
  consentGranted: z.boolean(),
  consentWithdrawn: z.boolean().optional(),
});

/**
 * POST /api/support-intelligence/worker-verification
 * Authorised, session-bound screening workflow — no external DB crawl.
 * Actor and internal screening status are derived server-side, never trusted from the client.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(`si-wvg:${ip}`, { windowMs: 60_000, max: 10 })) {
    return Response.json({ error: "Rate limit reached." }, { status: 429 });
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

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

  const profile = await prisma.workerProfile.findUnique({
    where: { id: parsed.data.workerProfileId },
    select: {
      id: true,
      userId: true,
      workerScreeningStatus: true,
    },
  });

  if (!profile) {
    return Response.json({ error: "Worker profile not found." }, { status: 404 });
  }

  const isOwner = profile.userId === user.id;
  const isAdmin = isAdminRole(user.primaryRole);
  if (!isOwner && !isAdmin) {
    return apiForbidden();
  }

  const result = await lookupWorkerVerification({
    workerProfileId: profile.id,
    internalScreeningStatus: profile.workerScreeningStatus,
    identityTokens: parsed.data.identityTokens,
    actorUserId: user.id,
    consentGranted: parsed.data.consentGranted,
    consentWithdrawn: parsed.data.consentWithdrawn,
  });

  if (result.ok && result.humanReviewRequired) {
    await enqueueHumanReview({
      reasons: result.humanReviewReasons,
      entityType: "WorkerProfile",
      entityId: profile.id,
      actorUserId: user.id,
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
