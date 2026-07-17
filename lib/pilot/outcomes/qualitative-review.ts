export function summariseQualitativeThemes(
  comments: readonly string[]
): { themes: string[]; sampleSize: number } {
  const themes = new Set<string>();
  for (const c of comments) {
    const lower = c.toLowerCase();
    if (lower.includes("access")) themes.add("accessibility");
    if (lower.includes("wait") || lower.includes("delay")) themes.add("timeliness");
    if (lower.includes("respect") || lower.includes("dignity")) themes.add("dignity");
    if (lower.includes("confus") || lower.includes("unclear")) themes.add("clarity");
  }
  return { themes: [...themes], sampleSize: comments.length };
}
