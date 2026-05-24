import { NextResponse } from "next/server";

import {
  processInboundVoiceWebhook,
  recordTwilioWebhookEvent,
} from "@/lib/communications/twilio-webhook-service";
import {
  formDataToRecord,
  validateTwilioWebhookSignature,
} from "@/lib/twilio/twilio-webhook-validator";

export async function POST(req: Request) {
  const formData = await req.formData();
  const payload = formDataToRecord(formData);
  const signature = req.headers.get("x-twilio-signature");
  const url = req.url;

  if (
    !validateTwilioWebhookSignature({
      signature,
      url,
      body: payload,
    })
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  await recordTwilioWebhookEvent({
    eventType: "inbound_voice",
    payload,
    twilioSid: payload.CallSid,
  });

  await processInboundVoiceWebhook(payload);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Thank you for calling MapAble. Please use the app or website for support.</Say></Response>`;
  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
