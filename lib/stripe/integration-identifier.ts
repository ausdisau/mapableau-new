import { createHash } from "node:crypto";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

/**
 * Stripe Checkout `integration_identifier`: label plus 8 letters.
 * When `stableKey` is provided (e.g. a Stripe request idempotency key), the
 * suffix is derived from that key so retries send an identical request body.
 * Without a stable key, the suffix stays random (one-shot creates).
 */
export function checkoutIntegrationIdentifier(
  label: string,
  stableKey?: string,
): string {
  let suffix = "";
  if (stableKey?.trim()) {
    const digest = createHash("sha256").update(stableKey.trim()).digest();
    for (let i = 0; i < 8; i += 1) {
      suffix += LETTERS[digest[i]! % LETTERS.length];
    }
  } else {
    for (let i = 0; i < 8; i += 1) {
      suffix += LETTERS[Math.floor(Math.random() * LETTERS.length)];
    }
  }
  return `${label}-${suffix}`;
}

export function billingInvoiceCheckoutReturnUrls(
  appUrl: string,
  invoiceId: string,
) {
  const base = `${appUrl}/billing/invoices`;
  return {
    successUrl: `${base}?checkout=success&invoiceId=${encodeURIComponent(invoiceId)}`,
    cancelUrl: `${base}?checkout=cancelled&invoiceId=${encodeURIComponent(invoiceId)}`,
  };
}
