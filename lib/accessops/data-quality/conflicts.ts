export function valuesConflict(left: unknown, right: unknown): boolean {
  return (
    left !== undefined &&
    right !== undefined &&
    JSON.stringify(left) !== JSON.stringify(right)
  );
}
