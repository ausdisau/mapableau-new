/**
 * Feature flags for first-party Deputy / Xero / Stripe booking integrations.
 * All default OFF / dry-run ON. Do not enable in production without owner signoff.
 */

function envTrue(name: string): boolean {
  return process.env[name] === "true";
}

export const integrationsFeatureFlags = {
  /** Durable IntegrationDelivery worker. Default off. */
  outboxEnabled: () => envTrue("MAPABLE_INTEGRATIONS_OUTBOX_ENABLED"),
  /** When true, deliveries are recorded but remote provider calls are skipped. Default true. */
  dryRun: () => process.env.MAPABLE_INTEGRATIONS_DRY_RUN !== "false",
  /** Direct Deputy OAuth + draft roster. Default off. */
  deputyEnabled: () => envTrue("DEPUTY_ENABLED"),
  /** Direct Xero OAuth + draft ACCREC (replaces placeholders when live). Default off. */
  xeroDirectEnabled: () => envTrue("XERO_DIRECT_ENABLED"),
  /** Wire Care booking → Checkout for authorised private/self-managed only. Default off. */
  stripeDirectBookingEnabled: () => envTrue("STRIPE_DIRECT_BOOKING_ENABLED"),
  /** Deputy webhook HMAC verification mode: disabled | enterprise_hmac */
  deputyWebhookVerificationMode: (): "disabled" | "enterprise_hmac" => {
    const mode = process.env.DEPUTY_WEBHOOK_VERIFICATION_MODE?.trim();
    return mode === "enterprise_hmac" ? "enterprise_hmac" : "disabled";
  },
} as const;

export type IntegrationsFeatureFlags = typeof integrationsFeatureFlags;
