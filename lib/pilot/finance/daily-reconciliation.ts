export type ReconciliationLine = {
  source: string;
  amountCents: number;
};

export type ReconciliationResult = {
  balanced: boolean;
  deltaCents: number;
  ledgerTotalCents: number;
  externalTotalCents: number;
};

export function reconcileDailyExposure(input: {
  ledgerLines: readonly ReconciliationLine[];
  externalLines: readonly ReconciliationLine[];
}): ReconciliationResult {
  const ledgerTotalCents = input.ledgerLines.reduce((s, l) => s + l.amountCents, 0);
  const externalTotalCents = input.externalLines.reduce(
    (s, l) => s + l.amountCents,
    0
  );
  const deltaCents = ledgerTotalCents - externalTotalCents;
  return {
    balanced: deltaCents === 0,
    deltaCents,
    ledgerTotalCents,
    externalTotalCents,
  };
}
