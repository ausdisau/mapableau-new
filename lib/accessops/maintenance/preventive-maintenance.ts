export function nextPreventiveMaintenanceDate(
  lastCompletedAt: Date,
  intervalDays: number,
): Date {
  return new Date(
    lastCompletedAt.getTime() + Math.max(1, intervalDays) * 24 * 60 * 60 * 1000,
  );
}

export function isPreventiveMaintenanceDue(
  nextDueAt: Date,
  now: Date = new Date(),
): boolean {
  return nextDueAt.getTime() <= now.getTime();
}
