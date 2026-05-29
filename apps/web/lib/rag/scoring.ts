const STOP = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "to",
  "for",
  "of",
  "in",
  "on",
  "at",
  "my",
  "me",
  "i",
  "we",
  "you",
  "can",
  "could",
  "would",
  "should",
  "help",
  "need",
  "want",
  "with",
  "and",
  "or",
  "what",
  "how",
  "when",
  "where",
  "why",
  "mapable",
]);

export function queryTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export function scoreText(query: string, text: string): number {
  const terms = queryTerms(query);
  if (terms.length === 0) return 0;
  const hay = text.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    if (hay.includes(term)) hits += 1;
  }
  const phrase = query.trim().toLowerCase();
  const phraseBoost = phrase.length > 4 && hay.includes(phrase) ? 2 : 0;
  return hits + phraseBoost;
}

export function rankChunks<T extends { text: string; score: number }>(
  query: string,
  items: Omit<T, "score">[]
): T[] {
  return items
    .map((item) => ({
      ...item,
      score: scoreText(query, item.text),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score) as T[];
}
