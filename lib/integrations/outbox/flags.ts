/**
 * Shared integration outbox / dry-run flags for Deputy/Xero/Stripe orchestration.
 * Default OFF — cite docs/governance/asi-disability-care-constraints.md.
 */
export const integrationOutboxFlags = {
  get outboxEnabled() {
    return process.env.MAPABLE_INTEGRATIONS_OUTBOX_ENABLED === "true";
  },
  get dryRun() {
    return process.env.MAPABLE_INTEGRATIONS_DRY_RUN !== "false";
  },
  get deputyEnabled() {
    return process.env.DEPUTY_ENABLED === "true";
  },
  get xeroDirectEnabled() {
    return process.env.XERO_DIRECT_ENABLED === "true";
  },
  get stripeDirectBookingEnabled() {
    return process.env.STRIPE_DIRECT_BOOKING_ENABLED === "true";
  },
};

export function isIntegrationOutboxLive(): boolean {
  return (
    integrationOutboxFlags.outboxEnabled && !integrationOutboxFlags.dryRun
  );
}
