import { NextResponse } from "next/server";

import {
  processInboundSmsWebhook,
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
    eventType: "inbound_sms",
    payload,
    twilioSid: payload.MessageSid,
  });

  const result = await processInboundSmsWebhook(payload);

  if (result.reply) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(result.reply)}</Message></Response>`;
    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  return NextResponse.json({ ok: true });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
