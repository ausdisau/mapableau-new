export {
  getActiveQuotas,
  upsertQuotas,
  isWithinLimit,
} from "@/lib/tenancy/quotas/quota-service";
export type {
  QuotaDefinition,
  TenantQuotas,
} from "@/lib/tenancy/quotas/quota-service";
