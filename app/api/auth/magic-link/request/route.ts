import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api/response";
import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import {
  buildMagicLinkUrl,
  isMagicLinkEmailConfigured,
  sendMagicLinkEmail,
} from "@/lib/auth/magic-link-email";
import { createTwoFactorToken } from "@/lib/auth/two-factor-token";
import { prisma } from "@/lib/prisma";

const bodySchema = z
  .object({
    email: z.string().email(),
    callbackUrl: z.string().max(500).optional(),
  })
  .strict();

/**
 * Always returns a generic success when email format is valid to avoid
 * account enumeration. Sends a link only when SendGrid is configured and
 * the account exists.
 */
export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const email = normalizeAuthEmail(body.email);

    if (!isMagicLinkEmailConfigured()) {
      return jsonError(
        "Email sign-in links are not available right now. Use password, passkey, or social sign-in.",
        503,
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = createTwoFactorToken({
        purpose: "credentials-magic-link",
        userId: user.id,
        ttlSeconds: 15 * 60,
      });
      const magicUrl = buildMagicLinkUrl(token, body.callbackUrl);
      await sendMagicLinkEmail({ to: email, magicUrl });
    }

    return jsonOk({
      message:
        "If an account exists for that email, a sign-in link has been sent. Check your inbox and spam folder.",
    });
  } catch {
    return jsonError("Could not start email sign-in.", 400);
  }
}
