import { createHash } from "crypto";

import type { NdiaProviderClaimPayload } from "@/lib/ndis/provider-claiming/types";

/**
 * Deterministic idempotency key for a claim payload.
 * Used to detect duplicate synthetic submissions; not an NDIA-issued key.
 */
export function buildClaimIdempotencyKey(
  organisationId: string,
  payload: NdiaProviderClaimPayload,
): string {
  const material = JSON.stringify({
    organisationId,
    invoice: payload.invoiceReference,
    period: payload.servicePeriod,
    lines: payload.lines.map((l) => ({
      code: l.supportItemCode,
      date: l.serviceDate,
      qty: l.quantity,
      total: l.totalCents,
    })),
    totalCents: payload.totals.totalCents,
  });
  return createHash("sha256").update(material).digest("hex");
}

export function isDuplicateIdempotencyKey(
  previousKey: string | null | undefined,
  nextKey: string,
): boolean {
  return Boolean(previousKey && previousKey === nextKey);
}
