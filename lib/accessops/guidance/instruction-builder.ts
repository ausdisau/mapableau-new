export function buildInstruction(steps: string[]): string[] {
  return steps.filter((step) => step.trim().length > 0);
}
