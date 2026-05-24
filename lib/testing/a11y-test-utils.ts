/** Helpers for accessibility test suites (Playwright / Vitest). */
export const A11Y_LANDMARK_ROLES = ["main", "navigation", "banner", "contentinfo"] as const;

export function assertHasAccessibleName(name: string | null | undefined): void {
  if (!name || name.trim().length === 0) {
    throw new Error("Expected accessible name on control");
  }
}

export function headingOrderValid(levels: number[]): boolean {
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) return false;
  }
  return true;
}
