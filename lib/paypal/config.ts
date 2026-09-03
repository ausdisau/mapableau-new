/**
 * PayPal Standard Checkout configuration (OSM HTML/JS sample adapted for Next.js).
 * Set PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (and optional amount/currency).
 */

export const paypalConfig = {
  clientId:
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  /** Fixed donation amount used when creating orders (sample default: 100). */
  donationAmount: process.env.PAYPAL_DONATION_AMOUNT ?? "100",
  currency: (process.env.PAYPAL_CURRENCY ?? "USD").toUpperCase(),
  /** Use sandbox unless explicitly set to live. */
  useProduction:
    process.env.PAYPAL_ENV === "live" ||
    process.env.PAYPAL_ENV === "production",
};

export function isPayPalConfigured(): boolean {
  return Boolean(paypalConfig.clientId && paypalConfig.clientSecret);
}

export function isPayPalClientConfigured(): boolean {
  return Boolean(paypalConfig.clientId);
}

export function paypalNotConfiguredResponse() {
  return {
    configured: false,
    error: "PayPal not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.",
  };
}
