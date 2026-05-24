import type { CommunicationChannel } from "@prisma/client";

import { sendSms } from "@/lib/twilio/send-sms";
import { sendWhatsApp } from "@/lib/twilio/send-whatsapp";
import { isTwilioConfigured } from "@/lib/twilio/config";

export type TwilioSendParams = {
  channel: CommunicationChannel;
  toE164: string;
  body: string;
};

export type TwilioSendAdapterResult = {
  sid: string;
  status: string;
  channel: CommunicationChannel;
  dryRun?: boolean;
};

export async function sendViaTwilio(
  params: TwilioSendParams
): Promise<TwilioSendAdapterResult> {
  if (!isTwilioConfigured()) {
    return {
      sid: `dry_run_${Date.now()}`,
      status: "queued",
      channel: params.channel,
      dryRun: true,
    };
  }

  if (params.channel === "whatsapp") {
    const result = await sendWhatsApp({
      toE164: params.toE164,
      body: params.body,
    });
    return { ...result, channel: "whatsapp" };
  }

  if (params.channel === "sms" || params.channel === "voice") {
    const result = await sendSms({
      toE164: params.toE164,
      body: params.body,
    });
    return { ...result, channel: params.channel };
  }

  throw new Error("CHANNEL_NOT_SUPPORTED_BY_TWILIO");
}
