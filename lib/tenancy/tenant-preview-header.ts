export const TENANT_PREVIEW_REQUEST_HEADER = "x-mapable-tenant-preview";

export function isTenantPreviewPathname(pathname: string): boolean {
  return (
    pathname === "/t" ||
    pathname.startsWith("/t/") ||
    pathname === "/coverage-care" ||
    pathname.startsWith("/coverage-care/")
  );
}
