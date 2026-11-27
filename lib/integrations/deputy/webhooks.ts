import { createHmac, timingSafeEqual } from "crypto";

import { recordReconciliationObservation } from "@/lib/integrations/delivery/reconciliation-service";
import { getDeputyOAuthConfig } from "@/lib/integrations/deputy/config";
import { fetchDeputyTimesheetHint } from "@/lib/integrations/deputy/timesheets";

export type DeputyWebhookDisposition =
  | { action: "ignored"; reason: string }
  | { action: "hint_refetch"; resourceType: string; resourceId: string }
  | { action: "verified_hint"; resourceType: string; resourceId: string };

/**
 * Deputy documented X-Deputy-Secret HMAC is Enterprise-based.
 * When verification mode is disabled or secret missing, treat callbacks as untrusted hints only.
 */
export function verifyDeputyWebhookSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
}): { ok: boolean; mode: "enterprise_hmac" | "disabled" | "missing_secret" } {
  const cfg = getDeputyOAuthConfig();
  if (cfg.webhookMode !== "enterprise_hmac") {
    return { ok: false, mode: "disabled" };
  }
  if (!cfg.webhookSecret) {
    return { ok: false, mode: "missing_secret" };
  }
  if (!input.signatureHeader) {
    return { ok: false, mode: "enterprise_hmac" };
  }

  const digest = createHmac("sha256", cfg.webhookSecret)
    .update(input.rawBody, "utf8")
    .digest("hex");

  try {
    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(input.signatureHeader.trim(), "utf8");
    if (a.length !== b.length) return { ok: false, mode: "enterprise_hmac" };
    return {
      ok: timingSafeEqual(a, b),
      mode: "enterprise_hmac",
    };
  } catch {
    return { ok: false, mode: "enterprise_hmac" };
  }
}

/**
 * Ingest Deputy webhook. Unsigned/unverified payloads never mutate MapAble SoT —
 * they only enqueue reconciliation / authenticated refetch hints.
 */
export async function ingestDeputyWebhook(input: {
  organisationId: string;
  rawBody: string;
  signatureHeader: string | null;
}): Promise<DeputyWebhookDisposition> {
  const verified = verifyDeputyWebhookSignature({
    rawBody: input.rawBody,
    signatureHeader: input.signatureHeader,
  });

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(input.rawBody) as Record<string, unknown>;
  } catch {
    return { action: "ignored", reason: "malformed_json" };
  }

  const resourceType = String(
    payload.topic ?? payload.type ?? payload.resource ?? "unknown",
  );
  const resourceId = String(
    payload.id ?? payload.Id ?? payload.resourceId ?? "",
  );

  if (!resourceId) {
    return { action: "ignored", reason: "missing_resource_id" };
  }

  await recordReconciliationObservation({
    provider: "deputy",
    organisationId: input.organisationId,
    observedRemoteStatus: resourceType,
    discrepancyType: verified.ok ? "signed_webhook_hint" : "unsigned_webhook_hint",
    lastResult: "queued_for_refetch",
    metadataJson: {
      resourceType,
      resourceId,
      verified: verified.ok,
      mode: verified.mode,
    },
  });

  // Authenticated refetch for timesheet-like topics; never apply payroll approval as billing.
  if (/timesheet/i.test(resourceType)) {
    try {
      await fetchDeputyTimesheetHint({
        organisationId: input.organisationId,
        timesheetId: resourceId,
      });
    } catch {
      // Outage: observation already recorded; scheduled recon will retry.
    }
  }

  return verified.ok
    ? { action: "verified_hint", resourceType, resourceId }
    : { action: "hint_refetch", resourceType, resourceId };
}
