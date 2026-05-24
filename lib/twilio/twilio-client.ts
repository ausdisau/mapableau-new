import Twilio from "twilio";

import { isTwilioConfigured, twilioConfig } from "@/lib/twilio/config";

let client: ReturnType<typeof Twilio> | null = null;

export function getTwilioClient(): ReturnType<typeof Twilio> {
  if (!isTwilioConfigured()) {
    throw new Error("TWILIO_NOT_CONFIGURED");
  }
  if (!client) {
    client = Twilio(twilioConfig.accountSid!, twilioConfig.authToken!);
  }
  return client;
}

export function resetTwilioClientForTests(): void {
  client = null;
}
