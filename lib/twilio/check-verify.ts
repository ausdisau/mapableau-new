import { getTwilioClient } from "@/lib/twilio/twilio-client";
import { isTwilioVerifyConfigured, twilioConfig } from "@/lib/twilio/config";

export type CheckVerifyResult = {
  sid: string;
  status: string;
  valid: boolean;
};

export async function checkPhoneVerification(
  phoneE164: string,
  code: string
): Promise<CheckVerifyResult> {
  if (!isTwilioVerifyConfigured()) {
    throw new Error("TWILIO_VERIFY_NOT_CONFIGURED");
  }

  const client = getTwilioClient();
  const check = await client.verify.v2
    .services(twilioConfig.verifyServiceSid!)
    .verificationChecks.create({ to: phoneE164, code });

  return {
    sid: check.sid,
    status: check.status,
    valid: check.status === "approved",
  };
}
