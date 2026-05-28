/** Relative in-app paths only — blocks open redirects via protocol-relative URLs. */
export function isSafeRedirect(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  return true;
}
