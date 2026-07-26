import { NextResponse } from "next/server";

import {
  deliverN8nEvent,
  verifyN8nWebhookSignature,
} from "@/lib/automation/n8n/n8n-webhook-service";

/**
 * Inbound n8n automation webhook.
 *
 * SECURITY: Always verify `x-n8n-signature` (HMAC-SHA256 of the raw body with
 * `N8N_WEBHOOK_SECRET`) before parsing JSON or performing side effects.
 * Missing/invalid signatures → 401 Unauthorized (no body introspection).
 */
export async function POST(request: Request) {
  // Read raw body first — signature must cover exact bytes, not re-serialized JSON.
  const rawBody = await request.text();

  // Extract signature header (case-insensitive via Headers API).
  const signature = request.headers.get("x-n8n-signature");

  // Constant-time HMAC verification; rejects when secret/signature missing.
  if (!verifyN8nWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { eventKey?: string; payload?: Record<string, unknown> };
  try {
    body = JSON.parse(rawBody) as {
      eventKey?: string;
      payload?: Record<string, unknown>;
    };
  } catch {
    // Authenticated but malformed — do not leak stack traces.
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.eventKey || typeof body.eventKey !== "string") {
    return NextResponse.json({ error: "eventKey is required" }, { status: 400 });
  }

  try {
    const result = await deliverN8nEvent(body.eventKey, body.payload ?? {});
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delivery failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
