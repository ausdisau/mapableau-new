export function pathwayWheelchairAccess(
  value?: string | number | null,
): "accessible" | "not_accessible" | "unknown" {
  if (value === 1 || value === "1") return "accessible";
  if (value === 2 || value === "2") return "not_accessible";
  return "unknown";
}
