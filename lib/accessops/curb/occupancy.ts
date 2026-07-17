export function projectCurbOccupancy(
  occupied: boolean | null,
): "occupied" | "available" | "unknown" {
  if (occupied === null) return "unknown";
  return occupied ? "occupied" : "available";
}
