import type { NdisBillingRoute, NdisDispatchStatus } from "@prisma/client";

export type RouteDispatchLine = {
  billableItemId: string;
  participantId: string | null;
  supportItemCode: string | null;
  description: string;
  serviceStartAt: string;
  serviceEndAt: string;
  quantity: string;
  unitPriceCents: number;
  totalCents: number;
};

export type RouteDispatchContext = {
  organisationId: string;
  actorUserId: string;
  correlationId: string;
  billingRoute: NdisBillingRoute;
  batchId?: string | null;
  dryRun?: boolean;
  /** For self-managed: only these line IDs may be included (not whole batch). */
  lineIds: string[];
  lines: RouteDispatchLine[];
};

export type RouteDispatchResult = {
  adapterKind: string;
  status: NdisDispatchStatus | "draft_built" | "export_generated" | "mock";
  externalReference: string | null;
  contentChecksum: string | null;
  /** Exact document/invoice IDs created (never guess from latest N). */
  documentIds: string[];
  payloadPreview?: string | null;
  markedSubmitted: boolean;
  safeMessage: string;
};

export interface BillingRouteDispatchAdapter {
  readonly kind: string;
  dispatch(context: RouteDispatchContext): Promise<RouteDispatchResult>;
}
