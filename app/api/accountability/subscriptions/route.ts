import { createHash } from "crypto";

import { z } from "zod";

import { createPublicSubscription } from "@/lib/accountability/public-reader";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/current-user";

const subscriptionSchema = z.object({
  email: z.string().email(),
  topics: z.array(z.string().min(2).max(60)).min(1).max(20),
  channel: z.enum(["email", "in_app"]).default("email"),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(`accountability-subscribe:${ip}`, { windowMs: 600_000, max: 10 })) {
    return jsonError("Too many subscription attempts. Please try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const user = await getCurrentUser();
  const emailHash = createHash("sha256")
    .update(parsed.data.email.trim().toLowerCase())
    .digest("hex");

  const subscription = await createPublicSubscription({
    topics: parsed.data.topics,
    channel: parsed.data.channel,
    userId: user?.id,
    emailHash,
  });

  return jsonOk({ ok: true, id: subscription.id }, 201);
}
