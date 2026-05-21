export const GST_RATE_BPS = 1000; // 10% GST in basis points (1000 = 10.00%)
export const DEFAULT_PLATFORM_FEE_BPS = 500; // 5% platform fee

export type LineItemInput = {
  description: string;
  quantity: number;
  unitAmountCents: number;
  gstApplicable?: boolean;
  ndisLineItem?: string;
};

export type InvoiceTotals = {
  subtotalCents: number;
  gstCents: number;
  platformFeeCents: number;
  totalCents: number;
};

/**
 * Calculate GST on a line total (10% for Australia when applicable).
 */
export function calculateGstCents(
  amountCents: number,
  gstApplicable: boolean
): number {
  if (!gstApplicable || amountCents <= 0) return 0;
  return Math.round((amountCents * GST_RATE_BPS) / 10000);
}

/**
 * Platform fee as a percentage of subtotal (before GST).
 */
export function calculatePlatformFeeCents(
  subtotalCents: number,
  feeBps: number = DEFAULT_PLATFORM_FEE_BPS
): number {
  if (subtotalCents <= 0) return 0;
  return Math.round((subtotalCents * feeBps) / 10000);
}

export function calculateLineItemTotalCents(
  quantity: number,
  unitAmountCents: number
): number {
  return Math.max(0, quantity) * Math.max(0, unitAmountCents);
}

/**
 * Compute invoice totals from line items and optional platform fee override.
 */
export function calculateInvoiceTotals(
  lineItems: LineItemInput[],
  options?: { platformFeeBps?: number; platformFeeCents?: number }
): InvoiceTotals {
  let subtotalCents = 0;
  let gstCents = 0;

  for (const item of lineItems) {
    const lineTotal = calculateLineItemTotalCents(
      item.quantity,
      item.unitAmountCents
    );
    subtotalCents += lineTotal;
    gstCents += calculateGstCents(lineTotal, item.gstApplicable ?? false);
  }

  const platformFeeCents =
    options?.platformFeeCents ??
    calculatePlatformFeeCents(subtotalCents, options?.platformFeeBps);

  const totalCents = subtotalCents + gstCents + platformFeeCents;

  return { subtotalCents, gstCents, platformFeeCents, totalCents };
}
