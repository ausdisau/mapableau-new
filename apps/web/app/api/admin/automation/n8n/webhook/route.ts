import { NextResponse } from "next/server";

import {
  deliverN8nEvent,
  verifyN8nWebhookSignature,
} from "@/lib/automation/n8n/n8n-webhook-service";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-n8n-signature");

  if (!verifyN8nWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(raw) as { eventKey: string; payload?: Record<string, unknown> };

  try {
    const result = await deliverN8nEvent(
      body.eventKey,
      body.payload ?? {}
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delivery failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
