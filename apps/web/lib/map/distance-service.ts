import { distanceKm } from "@/lib/geo";

export { distanceKm };

export function sortByDistance<T extends { distanceKm?: number | null }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
  );
}
