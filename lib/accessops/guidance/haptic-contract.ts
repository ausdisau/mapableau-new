export interface HapticCue {
  pattern: "short" | "long" | "double";
  meaning: string;
}

export function buildHapticCue(
  pattern: HapticCue["pattern"],
  meaning: string,
): HapticCue {
  return { pattern, meaning };
}
