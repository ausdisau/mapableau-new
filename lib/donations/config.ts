/** Min one-time donation: $5 AUD. */
export const DONATION_MIN_AMOUNT_CENTS = 500;

/** Max one-time donation: $50,000 AUD. */
export const DONATION_MAX_AMOUNT_CENTS = 5_000_000;

export const DONATION_PRESET_CENTS = [2500, 5000, 10_000, 25_000] as const;

export const DONATION_METADATA_PURPOSE = "donation";
export const DONATION_METADATA_FLOW = "donation";

/**
 * Independent of billing `STRIPE_ENABLED` so donations can ship without
 * opening invoice/subscription billing.
 */
export function isDonationStripeEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    env.MAPABLE_DONATIONS_STRIPE_ENABLED === "true" &&
    Boolean(env.STRIPE_SECRET_KEY?.trim())
  );
}

export function isDonationMetadata(
  metadata: Record<string, string> | null | undefined,
): boolean {
  if (!metadata) return false;
  return (
    metadata.purpose === DONATION_METADATA_PURPOSE ||
    metadata.mapableFlow === DONATION_METADATA_FLOW
  );
}
