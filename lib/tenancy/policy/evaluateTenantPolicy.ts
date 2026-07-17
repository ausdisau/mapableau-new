import { prisma } from "@/lib/prisma";

export interface TenantPolicyDecision {
  policyKey: string;
  version: string | null;
  status: "active" | "not_configured" | "not_effective";
  policyJson: unknown | null;
}

/**
 * Look up the active version of a tenant policy profile. Returns not_configured
 * if the tenant has no profile with that key. Returns not_effective if the
 * profile is present but not currently within its effective window.
 */
export async function evaluateTenantPolicy(
  organisationId: string,
  policyKey: string
): Promise<TenantPolicyDecision> {
  const now = new Date();
  const row = await prisma.tenantPolicyProfile.findFirst({
    where: { organisationId, profileKey: policyKey, status: "active" },
    orderBy: { version: "desc" },
  });
  if (!row) {
    return {
      policyKey,
      version: null,
      status: "not_configured",
      policyJson: null,
    };
  }
  const startsOk = !row.effectiveFrom || row.effectiveFrom.getTime() <= now.getTime();
  const endsOk = !row.effectiveUntil || row.effectiveUntil.getTime() > now.getTime();
  if (!startsOk || !endsOk) {
    return {
      policyKey,
      version: row.version,
      status: "not_effective",
      policyJson: row.policyJson,
    };
  }
  return {
    policyKey,
    version: row.version,
    status: "active",
    policyJson: row.policyJson,
  };
}
