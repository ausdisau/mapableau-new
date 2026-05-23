export function calculateInvoiceTotals(lines: Array<{
  quantity: number;
  unitAmountCents: number;
  claimableByNdis?: boolean;
  gstApplicable?: boolean;
  ndisClaimableAmountCents?: number | null;
  privatePayAmountCents?: number | null;
}>) {
  let subtotalCents = 0;
  let taxCents = 0;
  let ndisClaimableCents = 0;
  let participantGapCents = 0;

  for (const line of lines) {
    const qty = line.quantity;
    const lineTotal = Math.round(qty * line.unitAmountCents);
    subtotalCents += lineTotal;

    if (line.gstApplicable) {
      taxCents += Math.round(lineTotal * 0.1);
    }

    const ndisPart =
      line.ndisClaimableAmountCents ??
      (line.claimableByNdis ? lineTotal : 0);
    const gapPart =
      line.privatePayAmountCents ?? Math.max(0, lineTotal - ndisPart);

    ndisClaimableCents += ndisPart;
    participantGapCents += gapPart;
  }

  const totalCents = subtotalCents + taxCents;

  return {
    subtotalCents,
    taxCents,
    totalCents,
    ndisClaimableCents,
    participantGapCents,
  };
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const seq = String(now.getTime()).slice(-6);
  return `INV-${y}${m}${d}-${seq}`;
}
