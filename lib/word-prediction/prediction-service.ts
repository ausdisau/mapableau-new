import type {
  PredictionContext,
  PredictionSuggestion,
} from "@/types/word-prediction";

import { currentWordPrefix } from "@/lib/word-prediction/caret-utils";
import { getCorpusForContext } from "@/lib/word-prediction/phrase-corpus";

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function scoreMatch(
  item: string,
  query: string,
  context: PredictionContext
): number {
  const n = normalize(item);
  const q = normalize(query);
  if (!q) return 0;
  if (n === q) return 100;
  if (n.startsWith(q)) return 80 + Math.min(q.length, 20);
  if (n.includes(` ${q}`)) return 50;
  const words = n.split(/\s+/);
  if (words.some((w) => w.startsWith(q))) return 40;
  if (context !== "general" && item.length > 20) return 5;
  return 0;
}

export function suggestWordsAndPhrases(params: {
  query: string;
  caret?: number;
  context: PredictionContext;
  limit: number;
  customPhrases?: string[];
}): PredictionSuggestion[] {
  const caret = params.caret ?? params.query.length;
  const prefix = currentWordPrefix(params.query, caret);
  const q = prefix || params.query.trim();
  if (q.length < 1) return [];

  const corpus = [
    ...getCorpusForContext(params.context),
    ...(params.customPhrases ?? []),
  ];

  const scored = corpus
    .map((text, i) => ({
      text,
      score: scoreMatch(text, q, params.context),
      i,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.text.length - b.text.length);

  const seen = new Set<string>();
  const out: PredictionSuggestion[] = [];

  for (const row of scored) {
    const key = normalize(row.text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `${row.i}-${key.slice(0, 12)}`,
      text: row.text,
      kind: row.text.includes(" ") ? "phrase" : "word",
      score: row.score,
    });
    if (out.length >= params.limit) break;
  }

  return out;
}

export function buildPredictionLiveMessage(
  loading: boolean,
  count: number
): string {
  if (loading) return "Loading suggestions";
  if (count === 0) return "No suggestions";
  return `${count} suggestion${count === 1 ? "" : "s"} available`;
}
