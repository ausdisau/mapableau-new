import { createHmac, timingSafeEqual } from "crypto";

import { getN8nConfig, isN8nEnabled } from "@/lib/automation/n8n/n8n-client";
import { redactAutomationPayload } from "@/lib/automation/n8n/n8n-event-publisher";
import { IntegrationSafetyBlockedError } from "@/lib/integrations/integration-error";
import { isAutomationEventAllowed } from "@/lib/integrations/integration-feature-policy";
import { prisma } from "@/lib/prisma";

/**
 * Verify an inbound n8n webhook using HMAC-SHA256 over the raw body.
 *
 * Security notes:
 * - Secret is read from `N8N_WEBHOOK_SECRET` (fail closed when unset).
 * - Comparison uses `crypto.timingSafeEqual` on equal-length buffers to
 *   avoid leaking secret material via timing side channels.
 * - Accepts optional `sha256=` prefix (common webhook convention).
 */
export function verifyN8nWebhookSignature(
  body: string,
  signature: string | null,
): boolean {
  // Prefer explicit env read for auditability; getN8nConfig mirrors the same var.
  const webhookSecret =
    process.env.N8N_WEBHOOK_SECRET?.trim() || getN8nConfig().webhookSecret;

  // Fail closed: missing secret or signature must never authenticate.
  if (!webhookSecret || !signature) {
    return false;
  }

  const provided = signature.trim().toLowerCase().replace(/^sha256=/, "");
  // Reject non-hex input early (also keeps Buffer lengths aligned for timingSafeEqual).
  if (!/^[0-9a-f]+$/.test(provided)) {
    return false;
  }

  const expected = createHmac("sha256", webhookSecret)
    .update(body, "utf8")
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");

  // timingSafeEqual throws if lengths differ — treat as invalid, never throw to callers.
  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }

  try {
    return timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

export async function deliverN8nEvent(
  eventKey: string,
  payload: Record<string, unknown>,
) {
  if (!isN8nEnabled()) {
    throw new Error("n8n disabled");
  }
  if (!isAutomationEventAllowed(eventKey)) {
    throw new IntegrationSafetyBlockedError(eventKey);
  }

  const redacted = redactAutomationPayload(payload);
  const hash = JSON.stringify(redacted);

  const event = await prisma.automationWebhookEvent.create({
    data: { eventKey, payloadHash: hash, status: "received" },
  });

  await prisma.automationDelivery.create({
    data: { eventId: event.id, status: "delivered", sentAt: new Date() },
  });

  return { eventId: event.id, payload: redacted };
}
