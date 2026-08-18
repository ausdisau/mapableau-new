const LETTERS = "abcdefghijklmnopqrstuvwxyz";

/** Stripe Checkout `integration_identifier`: label plus 8 random letters. */
export function checkoutIntegrationIdentifier(label: string): string {
  let suffix = "";
  for (let i = 0; i < 8; i += 1) {
    suffix += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }
  return `${label}-${suffix}`;
}

export function billingInvoiceCheckoutReturnUrls(
  appUrl: string,
  invoiceId: string
) {
  const base = `${appUrl}/billing/invoices`;
  return {
    successUrl: `${base}?checkout=success&invoiceId=${encodeURIComponent(invoiceId)}`,
    cancelUrl: `${base}?checkout=cancelled&invoiceId=${encodeURIComponent(invoiceId)}`,
  };
}
