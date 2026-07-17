/**
 * Object-storage path helpers. All paths MUST be prefixed by a tenant key so
 * that a single misfiled object cannot leak cross-tenant.
 */

const PATH_SAFE = /^[a-z0-9][a-z0-9_-]{2,63}$/;

export function assertSafeTenantKey(tenantKey: string): void {
  if (!PATH_SAFE.test(tenantKey)) {
    throw new Error(`OBJECT_PATH_UNSAFE_TENANT_KEY:${tenantKey}`);
  }
}

export function tenantObjectPath(
  tenantKey: string,
  bucket: "private" | "shared",
  ...segments: string[]
): string {
  assertSafeTenantKey(tenantKey);
  const safeSegments = segments.map((s) => {
    if (!s || s.includes("..") || s.includes("//")) {
      throw new Error(`OBJECT_PATH_UNSAFE_SEGMENT:${s}`);
    }
    return s.replace(/^\/+|\/+$/g, "");
  });
  return ["tenants", tenantKey, bucket, ...safeSegments].join("/");
}
