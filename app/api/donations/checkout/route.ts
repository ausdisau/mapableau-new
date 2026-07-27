import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  DONATION_MAX_AMOUNT_CENTS,
  DONATION_MIN_AMOUNT_CENTS,
} from "@/lib/donations/config";
import { createDonationCheckoutSession } from "@/lib/donations/stripe-checkout";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;

const BodySchema = z.object({
  amountCents: z
    .number()
    .int()
    .min(DONATION_MIN_AMOUNT_CENTS)
    .max(DONATION_MAX_AMOUNT_CENTS),
  customLabel: z.string().trim().max(120).optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(ip, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    })
  ) {
    return jsonError(
      "Too many donation attempts. Please wait a minute and try again.",
      429,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const result = await createDonationCheckoutSession({
    amountCents: parsed.data.amountCents,
    customLabel: parsed.data.customLabel,
  });

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return jsonOk({ url: result.url, sessionId: result.sessionId });
}
