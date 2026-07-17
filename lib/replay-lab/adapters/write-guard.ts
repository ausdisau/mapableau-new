/**
 * Synthetic adapter write guard — permanent deny of production domain writes.
 */

export class ReplayProductionWriteError extends Error {
  constructor(target: string) {
    super(
      `Replay Lab refused production write to ${target}. Synthetic adapters may only emit mapable.replay.* ledger events.`,
    );
    this.name = "ReplayProductionWriteError";
  }
}

export const FORBIDDEN_PRODUCTION_WRITE_TARGETS = [
  "CareShift",
  "CareBooking",
  "TransportTrip",
  "TransportBooking",
  "BillingInvoice",
  "NdiaProviderClaim",
  "Worker",
  "Message",
  "prisma",
] as const;

/**
 * Call only when an adapter path would write to a production domain model.
 * Always throws — production writes are permanently denied.
 */
export function denyProductionDomainWrite(target: string): never {
  throw new ReplayProductionWriteError(target);
}

/** @deprecated Use denyProductionDomainWrite for attempted writes. */
export function assertNoProductionDomainWrite(target: string): void {
  const normalized = target.toLowerCase();
  for (const forbidden of FORBIDDEN_PRODUCTION_WRITE_TARGETS) {
    if (normalized === forbidden.toLowerCase() || normalized.includes(`/${forbidden.toLowerCase()}`)) {
      denyProductionDomainWrite(target);
    }
  }
  // If called with a bare forbidden model name as an "attempt", deny.
  for (const forbidden of FORBIDDEN_PRODUCTION_WRITE_TARGETS) {
    if (normalized === forbidden.toLowerCase()) {
      denyProductionDomainWrite(target);
    }
  }
}

/** Network / external side effects are permanently denied from adapters. */
export function assertNoExternalSideEffect(action: string): never {
  throw new Error(
    `Replay Lab denied external side effect: ${action}. MAPABLE_REPLAY_EXTERNAL_MESSAGES_ENABLED is permanently false.`,
  );
}

/** Marker for adapter modules — documents synthetic-only contract. */
export const REPLAY_ADAPTER_SYNTHETIC_ONLY = true as const;
