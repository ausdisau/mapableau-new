import type Stripe from "stripe";

import { paymentsMode } from "@/lib/payouts/config";

export class StripeLivemodeMismatchError extends Error {
  readonly status = 409;
  readonly code = "stripe_livemode_mismatch" as const;

  constructor(
    readonly eventId: string,
    readonly eventLivemode: boolean,
    readonly expectedMode: "live" | "test",
  ) {
    super(
      `Stripe livemode mismatch: event=${eventLivemode} env=${expectedMode} id=${eventId}`,
    );
    this.name = "StripeLivemodeMismatchError";
  }
}

/** Reject events whose livemode does not match MAPABLE_PAYMENTS_MODE. */
export function assertLivemodeMatches(event: Stripe.Event): void {
  const expectedLive = paymentsMode() === "live";
  if (event.livemode !== expectedLive) {
    throw new StripeLivemodeMismatchError(
      event.id,
      event.livemode,
      paymentsMode(),
    );
  }
}
