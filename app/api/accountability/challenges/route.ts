import { z } from "zod";

import { createPublicChallenge } from "@/lib/accountability/public-reader";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

const challengeSchema = z.object({
  subjectType: z.string().min(3).max(80),
  subjectPublicId: z.string().max(120).optional(),
  description: z.string().min(20).max(5000),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(`accountability-challenge:${ip}`, { windowMs: 600_000, max: 10 })) {
    return jsonError("Too many challenge submissions. Please try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = challengeSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const challenge = await createPublicChallenge(parsed.data);
  await createAuditEvent({
    action: "accountability.challenge_received",
    entityType: "AccountabilityPublicChallenge",
    entityId: challenge.trackingReference,
    metadata: { subjectType: parsed.data.subjectType },
  });

  return jsonOk(challenge, 201);
}
