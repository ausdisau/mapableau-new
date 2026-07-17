export function normalizeGradient(value?: number | null): number | "unknown" {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : "unknown";
}
