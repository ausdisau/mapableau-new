export {
  buildTenantContext,
  hasBreakGlass,
  hasExplicitTenantScope,
  isPlatformActor,
} from "@/lib/tenancy/context/tenant-context";
export type {
  TenantActorKind,
  TenantContext,
} from "@/lib/tenancy/context/tenant-context";

export const AUTHORITATIVE_TENANT_CONTEXT_MODULE =
  "@/lib/tenancy/context/tenant-context";

export const TENANT_CONTEXT_BOUNDARY_NOTES = [
  "Organisation.id is the tenant security boundary.",
  "A null organisationId is not an all-tenant scope.",
  "Break-glass requires a persisted BreakGlassSession id.",
] as const;
