export function symbolForAccessInstruction(kind: string): string {
  return kind === "lift"
    ? "elevator"
    : kind === "ramp"
      ? "ramp"
      : "accessibility";
}
