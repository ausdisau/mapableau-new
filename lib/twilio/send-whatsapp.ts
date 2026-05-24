import { getTwilioClient } from "@/lib/twilio/twilio-client";
import { twilioConfig } from "@/lib/twilio/config";

export type SendWhatsAppResult = {
  sid: string;
  status: string;
};

function whatsappAddress(e164: string): string {
  const normalized = e164.startsWith("+") ? e164 : `+${e164}`;
  return normalized.startsWith("whatsapp:") ? normalized : `whatsapp:${normalized}`;
}

export async function sendWhatsApp(params: {
  toE164: string;
  body: string;
}): Promise<SendWhatsAppResult> {
  const client = getTwilioClient();
  const from =
    twilioConfig.whatsappFrom ??
    (twilioConfig.messagingServiceSid
      ? undefined
      : twilioConfig.fromNumber);

  if (!from && !twilioConfig.messagingServiceSid) {
    throw new Error("TWILIO_WHATSAPP_FROM_REQUIRED");
  }

  const createParams: {
    to: string;
    body: string;
    from?: string;
    messagingServiceSid?: string;
  } = {
    to: whatsappAddress(params.toE164),
    body: params.body,
  };

  if (twilioConfig.messagingServiceSid) {
    createParams.messagingServiceSid = twilioConfig.messagingServiceSid;
  } else if (from) {
    createParams.from = whatsappAddress(from.replace(/^whatsapp:/, ""));
  }

  const message = await client.messages.create(createParams);
  return { sid: message.sid, status: message.status };
}
