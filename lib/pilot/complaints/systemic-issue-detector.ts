export type ComplaintSignal = {
  category: string;
  createdAt: Date;
};

/**
 * Heuristic clustering for human review — never auto-closes or auto-notifies.
 */
export function detectSystemicComplaintPattern(
  complaints: readonly ComplaintSignal[],
  windowDays = 14,
  threshold = 3
): { systemic: boolean; categories: string[] } {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const counts = new Map<string, number>();
  for (const c of complaints) {
    if (c.createdAt.getTime() < cutoff) continue;
    counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  }
  const categories = [...counts.entries()]
    .filter(([, n]) => n >= threshold)
    .map(([cat]) => cat);
  return { systemic: categories.length > 0, categories };
}
