import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  countRecentVerificationAttempts,
  startUserPhoneVerification,
} from "@/lib/communications/phone-verification-service";
import { phoneStartSchema } from "@/lib/validation/communications";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const parsed = phoneStartSchema.parse(await req.json());
    const attempts = await countRecentVerificationAttempts(user.id);
    if (attempts >= 5) {
      return jsonError("Too many verification attempts. Try again later.", 429);
    }

    const verification = await startUserPhoneVerification({
      userId: user.id,
      phone: parsed.phone,
      channel: parsed.channel,
    });

    return jsonOk({
      verificationId: verification.id,
      status: verification.status,
      expiresAt: verification.expiresAt,
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "INVALID_PHONE") {
        return jsonError("Invalid phone number", 400);
      }
      if (e.message === "RATE_LIMITED") {
        return jsonError("Rate limit exceeded", 429);
      }
      if (e.message === "TWILIO_VERIFY_NOT_CONFIGURED") {
        return jsonError("Phone verification is not available", 503);
      }
    }
    return jsonError("Verification could not be started", 500);
  }
}
