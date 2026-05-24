/**
 * Billing module integration hooks for MapAble Core.
 * No Stripe logic here — billing modules subscribe to these events.
 */

export type BillingHookEvent =
  | "invoice.draft_requested"
  | "invoice.issued"
  | "invoice.approved"
  | "invoice.paid"
  | "subscription.checkout_started";

export interface BillingHookPayload {
  participantId?: string;
  organisationId?: string;
  bookingId?: string;
  careShiftId?: string;
  transportBookingId?: string;
  bundleId?: string;
  invoiceId?: string;
  metadata?: Record<string, unknown>;
}

export type BillingHookHandler = (
  event: BillingHookEvent,
  payload: BillingHookPayload
) => void | Promise<void>;

const handlers: BillingHookHandler[] = [];

export function registerBillingHook(handler: BillingHookHandler): () => void {
  handlers.push(handler);
  return () => {
    const idx = handlers.indexOf(handler);
    if (idx >= 0) handlers.splice(idx, 1);
  };
}

export async function emitBillingHook(
  event: BillingHookEvent,
  payload: BillingHookPayload
): Promise<void> {
  for (const handler of handlers) {
    await handler(event, payload);
  }
}
