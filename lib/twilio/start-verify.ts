import { getTwilioClient } from "@/lib/twilio/twilio-client";
import { isTwilioVerifyConfigured, twilioConfig } from "@/lib/twilio/config";

export type StartVerifyResult = {
  sid: string;
  status: string;
};

export async function startPhoneVerification(
  phoneE164: string,
  channel: "sms" | "call" = "sms"
): Promise<StartVerifyResult> {
  if (!isTwilioVerifyConfigured()) {
    throw new Error("TWILIO_VERIFY_NOT_CONFIGURED");
  }

  const client = getTwilioClient();
  const verification = await client.verify.v2
    .services(twilioConfig.verifyServiceSid!)
    .verifications.create({ to: phoneE164, channel });

  return { sid: verification.sid, status: verification.status };
}
