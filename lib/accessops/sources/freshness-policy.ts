export function sourceIsFresh(
  lastUpdatedAt: Date | null,
  staleAfterSeconds: number,
  now: Date = new Date(),
): boolean {
  if (!lastUpdatedAt) return false;
  return lastUpdatedAt.getTime() + staleAfterSeconds * 1000 >= now.getTime();
}
