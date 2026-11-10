import { createHmac, timingSafeEqual } from "crypto";

import { recordReconciliationObservation } from "@/lib/integrations/delivery/reconciliation-service";
import { getXeroDirectConfig } from "@/lib/integrations/xero/config";

/**
 * Validate x-xero-signature HMAC-SHA256 over the raw request body.
 * @see https://developer.xero.com/documentation/guides/webhooks/overview
 */
export function verifyXeroWebhookSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
}): boolean {
  const key = getXeroDirectConfig().webhookKey;
  if (!key || !input.signatureHeader) return false;

  const digest = createHmac("sha256", key)
    .update(input.rawBody, "utf8")
    .digest("base64");

  try {
    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(input.signatureHeader.trim(), "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function ingestXeroWebhook(input: {
  organisationId: string;
  rawBody: string;
  signatureHeader: string | null;
}): Promise<{ ok: boolean; queued: boolean; reason?: string }> {
  if (!verifyXeroWebhookSignature(input)) {
    return { ok: false, queued: false, reason: "invalid_signature" };
  }

  let events: unknown[] = [];
  try {
    const parsed = JSON.parse(input.rawBody) as {
      events?: unknown[];
      Events?: unknown[];
    };
    events = parsed.events ?? parsed.Events ?? [];
  } catch {
    return { ok: false, queued: false, reason: "malformed_json" };
  }

  for (const event of events) {
    const e = event as Record<string, unknown>;
    await recordReconciliationObservation({
      provider: "xero",
      organisationId: input.organisationId,
      observedRemoteStatus: String(e.eventType ?? e.EventType ?? "unknown"),
      discrepancyType: "xero_webhook",
      lastResult: "queued_for_refetch",
      metadataJson: {
        resourceId: e.resourceId ?? e.ResourceId,
        tenantId: e.tenantId ?? e.TenantId,
        // Minimal — no participant health/support notes.
      },
    });
  }

  return { ok: true, queued: true };
}
