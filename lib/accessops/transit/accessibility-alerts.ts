export function isAccessibilityAlert(effect: string): boolean {
  return [
    "NO_SERVICE",
    "REDUCED_SERVICE",
    "MODIFIED_SERVICE",
    "ACCESSIBILITY_ISSUE",
  ].includes(effect);
}
