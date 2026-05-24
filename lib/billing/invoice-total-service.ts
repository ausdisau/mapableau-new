export type LineForTotal = {
  quantity: number;
  unitAmountCents: number;
  privatePayAmountCents?: number;
};

export function calculateLineTotal(line: LineForTotal): number {
  return Math.round(line.quantity * line.unitAmountCents);
}

export function calculateInvoiceTotals(lines: LineForTotal[]) {
  const subtotalCents = lines.reduce((sum, l) => sum + calculateLineTotal(l), 0);
  const privatePayCents = lines.reduce(
    (sum, l) => sum + (l.privatePayAmountCents ?? 0),
    0
  );
  const taxCents = 0;
  const totalCents = subtotalCents + taxCents;
  return { subtotalCents, taxCents, totalCents, privatePayCents };
}

export function amountDueForStripe(invoice: {
  totalCents: number;
  privatePayCents?: number | null;
}): number {
  if (invoice.privatePayCents != null && invoice.privatePayCents > 0) {
    return invoice.privatePayCents;
  }
  return invoice.totalCents;
}
