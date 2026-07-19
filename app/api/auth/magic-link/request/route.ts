import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { normalizeAuthEmail, safeAuthCallbackPath } from "@/lib/auth/auth-flow";
import {
  buildMagicLinkUrl,
  isMagicLinkEmailConfigured,
  sendMagicLinkEmail,
} from "@/lib/auth/magic-link-email";
import { issueMagicLinkToken } from "@/lib/auth/magic-link-token";
import { accessIndependenceConfig } from "@/lib/config/access-independence";
import { prisma } from "@/lib/prisma";

const bodySchema = z
  .object({
    email: z.string().email(),
    callbackUrl: z.string().max(500).optional(),
  })
  .strict();

const GENERIC_SUCCESS =
  "If an account exists for that email, a sign-in link has been sent. Check your inbox and spam folder.";

/**
 * Always returns a generic success when email format is valid to avoid
 * account enumeration. Sends a link only when SendGrid is configured and
 * the account exists. Tokens are one-time, hashed at rest, and rate-limited.
 */
export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const email = normalizeAuthEmail(body.email);
    const ip = getClientIp(req);
    const cfg = accessIndependenceConfig;

    if (
      !checkIpRateLimit(`magic-link:ip:${ip}`, {
        windowMs: cfg.magicLinkWindowMs,
        max: cfg.magicLinkMaxPerIpWindow,
      })
    ) {
      // Same outward shape — do not reveal whether the email exists.
      return jsonOk({ message: GENERIC_SUCCESS });
    }

    if (
      !checkIpRateLimit(`magic-link:email:${email}`, {
        windowMs: cfg.magicLinkWindowMs,
        max: cfg.magicLinkMaxPerEmailWindow,
      })
    ) {
      return jsonOk({ message: GENERIC_SUCCESS });
    }

    if (!isMagicLinkEmailConfigured()) {
      return jsonError(
        "Email sign-in links are not available right now. Use password, passkey, or social sign-in.",
        503,
      );
    }

    const callbackUrl = safeAuthCallbackPath(body.callbackUrl);

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const { rawToken } = await issueMagicLinkToken({
        userId: user.id,
        ttlSeconds: cfg.magicLinkTtlSeconds,
      });
      const magicUrl = buildMagicLinkUrl(rawToken, callbackUrl);
      await sendMagicLinkEmail({ to: email, magicUrl });
    }

    return jsonOk({ message: GENERIC_SUCCESS });
  } catch {
    return jsonError("Could not start email sign-in.", 400);
  }
}
