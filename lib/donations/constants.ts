/** Preset donation tiers in AUD cents. */
export const DONATION_PRESET_AMOUNTS_CENTS = [2500, 5000, 10000, 25000] as const;

export function getDonationsMinCents(): number {
  const parsed = Number.parseInt(process.env.DONATIONS_MIN_CENTS ?? "500", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 500;
}

export function getDonationsMaxCents(): number {
  const parsed = Number.parseInt(process.env.DONATIONS_MAX_CENTS ?? "1000000", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1_000_000;
}

/** Donations are on when Stripe is configured and not explicitly disabled. */
export function areDonationsEnabled(): boolean {
  if (process.env.DONATIONS_ENABLED === "false") return false;
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
