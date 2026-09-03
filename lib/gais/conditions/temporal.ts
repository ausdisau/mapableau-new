/**
 * Shared temporal activation logic for Access Conditions.
 * Single source of truth — used by GAIS, Go barriers, and change-review adapters.
 */

export type TemporalWindow = {
  reportedAt: Date | string;
  expiresAt?: Date | string | null;
};

export function parseActiveAt(value?: string | Date | null): Date {
  if (!value) return new Date();
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid activeAt timestamp");
  }
  return d;
}

/**
 * Event is active at `activeAt` when:
 * - reportedAt <= activeAt (future reports excluded)
 * - expiresAt is null OR expiresAt > activeAt
 */
export function isEventActiveAt(window: TemporalWindow, activeAt: Date): boolean {
  const reported = new Date(window.reportedAt).getTime();
  const at = activeAt.getTime();
  if (Number.isNaN(reported)) return false;
  if (reported > at) return false;

  if (window.expiresAt == null) return true;
  const expires = new Date(window.expiresAt).getTime();
  if (Number.isNaN(expires)) return false;
  return expires > at;
}

export function buildActiveAtPrismaFilter(activeAt: Date) {
  return {
    reportedAt: { lte: activeAt },
    OR: [{ expiresAt: null }, { expiresAt: { gt: activeAt } }],
  };
}
