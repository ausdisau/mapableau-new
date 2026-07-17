export interface DeprecatedPathway {
  name: string;
  path: string;
  replacement: string;
  reason: string;
}

export const DEPRECATED_PATHWAYS: readonly DeprecatedPathway[] = [
  {
    name: "multi-tenant-admin-tenant-context",
    path: "lib/multi-tenant-admin/tenant-context.ts",
    replacement: "lib/tenancy/context/tenant-context.ts",
    reason:
      "The multi-tenant admin context uses tenantId semantics and helper fallbacks that are not the RC1 tenant security boundary.",
  },
  {
    name: "route-local-auth-handlers",
    path: "app/api/**/route.ts",
    replacement: "lib/auth/guards.ts and lib/auth/current-user.ts",
    reason:
      "Route-local auth checks are consolidation candidates and must not become a new authority source.",
  },
] as const;

export const RELEASE_CANDIDATE_ALLOWLIST_VIOLATIONS: readonly string[] = [];

export function assertNotDeprecatedPathway(name: string): void {
  const deprecated = DEPRECATED_PATHWAYS.find(
    (pathway) => pathway.name === name,
  );
  if (deprecated) {
    throw new Error(
      `DEPRECATED_PATHWAY:${deprecated.name}: use ${deprecated.replacement}`,
    );
  }
}
