/** Normalize App Router pathname so business-host rewrites match clean hrefs. */
export function normalizeProviderCenterPathname(pathname: string): string {
  if (pathname === "/provider") return "/";
  if (pathname.startsWith("/provider/")) {
    return pathname.slice("/provider".length) || "/";
  }
  return pathname;
}
