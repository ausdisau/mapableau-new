export function buildAudioGuidanceText(instruction: string): string {
  return instruction.replace(/\s+/g, " ").trim();
}
