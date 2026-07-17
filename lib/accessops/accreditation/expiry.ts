export function isAccreditationExpired(
  expiresAt: Date | null,
  now: Date = new Date(),
): boolean {
  return Boolean(expiresAt && expiresAt.getTime() <= now.getTime());
}
