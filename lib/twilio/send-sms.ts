import { getTwilioClient } from "@/lib/twilio/twilio-client";
import { twilioConfig } from "@/lib/twilio/config";

export type SendSmsResult = {
  sid: string;
  status: string;
  dryRun?: boolean;
};

export async function sendSms(params: {
  toE164: string;
  body: string;
}): Promise<SendSmsResult> {
  const client = getTwilioClient();
  const createParams: {
    to: string;
    body: string;
    messagingServiceSid?: string;
    from?: string;
  } = {
    to: params.toE164,
    body: params.body,
  };

  if (twilioConfig.messagingServiceSid) {
    createParams.messagingServiceSid = twilioConfig.messagingServiceSid;
  } else if (twilioConfig.fromNumber) {
    createParams.from = twilioConfig.fromNumber;
  } else {
    throw new Error("TWILIO_FROM_OR_MESSAGING_SERVICE_REQUIRED");
  }

  const message = await client.messages.create(createParams);
  return { sid: message.sid, status: message.status };
}
