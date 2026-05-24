import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { checkUserPhoneVerification } from "@/lib/communications/phone-verification-service";
import { phoneCheckSchema } from "@/lib/validation/communications";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const parsed = phoneCheckSchema.parse(await req.json());
    const verification = await checkUserPhoneVerification({
      userId: user.id,
      phone: parsed.phone,
      code: parsed.code,
    });

    return jsonOk({
      verified: verification.status === "approved",
      phoneNumberE164: verification.phoneNumberE164,
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "INVALID_PHONE") {
        return jsonError("Invalid phone number", 400);
      }
      if (e.message === "VERIFICATION_FAILED") {
        return jsonError("Verification code is incorrect", 400);
      }
      if (e.message === "VERIFICATION_NOT_FOUND") {
        return jsonError("No pending verification found", 404);
      }
    }
    return jsonError("Verification could not be completed", 500);
  }
}
