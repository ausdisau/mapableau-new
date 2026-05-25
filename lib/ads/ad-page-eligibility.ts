/**
 * Routes where skyscraper ad rails must never render (sensitive workflows).
 */
const SENSITIVE_PREFIXES = [
  "/login",
  "/register",
  "/onboarding",
  "/participant/consent",
  "/participant/documents",
  "/documents",
  "/invoices",
  "/payments",
  "/checkout",
  "/emergency",
  "/incidents",
  "/safeguarding",
  "/privacy",
  "/settings/security",
  "/ndis-plan",
  "/moves/clinical-notes",
  "/admin/security",
  "/dashboard",
  "/admin",
  "/provider/invoices",
  "/provider/onboarding",
  "/billing",
  "/data-vault",
  "/assessor",
  "/driver",
  "/employer",
  "/enterprise-provider",
] as const;

const SENSITIVE_EXACT = new Set([
  "/privacy",
  "/login",
  "/register",
]);

/** Public routes where side rails may appear on large desktop viewports. */
const ELIGIBLE_PREFIXES = [
  "/provider-finder",
  "/providers",
  "/map",
  "/events",
  "/marketplace",
  "/jobs",
  "/foods",
  "/housing",
  "/academy",
  "/community",
  "/ask",
  "/core",
  "/jonathan/profile",
] as const;

function normalisePath(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function isSensitiveRoute(pathname: string): boolean {
  const path = normalisePath(pathname);
  if (SENSITIVE_EXACT.has(path)) return true;
  return SENSITIVE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function isEligibleAdRoute(pathname: string): boolean {
  const path = normalisePath(pathname);
  if (isSensitiveRoute(path)) return false;
  if (path === "/") return true;
  return ELIGIBLE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function pageContextFromPath(pathname: string): string {
  const path = normalisePath(pathname);
  if (path === "/") return "home";
  const segment = path.split("/").filter(Boolean)[0];
  return segment ?? "unknown";
}
