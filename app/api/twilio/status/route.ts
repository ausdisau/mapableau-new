import { NextResponse } from "next/server";

import {
  formDataToRecord,
  validateTwilioWebhookSignature,
} from "@/lib/twilio/twilio-webhook-validator";
import {
  processStatusWebhook,
  recordTwilioWebhookEvent,
} from "@/lib/communications/twilio-webhook-service";

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
    eventType: "status",
    payload,
    twilioSid: payload.MessageSid ?? payload.SmsSid,
  });

  await processStatusWebhook(payload);

  return NextResponse.json({ ok: true });
}
