import type {
  BillingRouteDispatchAdapter,
  RouteDispatchContext,
  RouteDispatchResult,
} from "@/lib/ndis-gateway/routing/adapters/types";

/** Deterministic mock adapter for dry-run / test environments. */
export class MockDispatchAdapter implements BillingRouteDispatchAdapter {
  readonly kind = "mock";

  async dispatch(context: RouteDispatchContext): Promise<RouteDispatchResult> {
    return {
      adapterKind: this.kind,
      status: "mock",
      externalReference: `MOCK-${context.correlationId.slice(0, 8)}`,
      contentChecksum: null,
      documentIds: [],
      markedSubmitted: false,
      safeMessage: `Mock dispatch for ${context.lineIds.length} line(s); route=${context.billingRoute}.`,
    };
  }
}

export const mockDispatchAdapter = new MockDispatchAdapter();
