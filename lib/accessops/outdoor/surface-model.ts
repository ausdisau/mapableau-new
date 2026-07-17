export type SurfaceQuality = "smooth" | "rough" | "unknown";

export function normalizeSurfaceQuality(value?: string | null): SurfaceQuality {
  if (value === "smooth" || value === "rough") return value;
  return "unknown";
}
