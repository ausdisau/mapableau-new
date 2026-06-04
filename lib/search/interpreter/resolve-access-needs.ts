import { ACCESS_NEEDS } from "@/lib/provider-finder/filters";

import { scoreTextAgainstQuery } from "./score-text";

export function resolveAccessNeedIds(accessText: string): string[] {
  const text = accessText.trim();
  if (!text) return [];

  const ids = new Set<string>();
  const lower = text.toLowerCase();

  for (const need of ACCESS_NEEDS) {
    if (lower.includes(need.label.toLowerCase())) {
      ids.add(need.id);
      continue;
    }
    const score = scoreTextAgainstQuery(
      [need.label, ...need.keywords],
      text,
    );
    if (score >= 2) ids.add(need.id);
  }

  return [...ids];
}
