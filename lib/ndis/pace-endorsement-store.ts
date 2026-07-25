/**
 * Scaffold in-memory PACE budget/expiry overlay.
 * No Prisma table (feature freeze) — replace with catalogue-backed store later.
 */

export type PaceBudgetOverlay = {
  participantId: string;
  supportCategoryCode: string;
  expirationDate: string; // ISO date
  remainingCategoryBudget: number; // AUD
  totalCategoryBudget: number; // AUD
  ndisNumber?: string;
};

const overlays = new Map<string, PaceBudgetOverlay>();

function key(participantId: string, categoryCode: string) {
  return `${participantId}::${categoryCode}`;
}

/** Seed a demo overlay for tests and local scaffolding. */
export function seedPaceBudgetOverlay(overlay: PaceBudgetOverlay): void {
  overlays.set(key(overlay.participantId, overlay.supportCategoryCode), overlay);
}

export function clearPaceBudgetOverlays(): void {
  overlays.clear();
}

export function getPaceBudgetOverlay(
  participantId: string,
  categoryCode: string
): PaceBudgetOverlay | null {
  return overlays.get(key(participantId, categoryCode)) ?? null;
}

/** Default scaffold budgets when no overlay is seeded. */
export function defaultPaceBudgetOverlay(
  participantId: string,
  categoryCode: string
): PaceBudgetOverlay {
  const existing = getPaceBudgetOverlay(participantId, categoryCode);
  if (existing) return existing;
  return {
    participantId,
    supportCategoryCode: categoryCode,
    expirationDate: new Date(
      Date.now() + 180 * 24 * 60 * 60 * 1000
    ).toISOString(),
    remainingCategoryBudget: 12_000,
    totalCategoryBudget: 20_000,
  };
}
