import { prisma } from "@/lib/prisma";

/**
 * Cross-tenant access review — enumerates recent BreakGlassSessions and any
 * outstanding delegated authorities that require review. This is read-only
 * and does not itself grant access.
 */
export async function listRecentBreakGlassSessions(sinceHours = 24 * 30) {
  const since = new Date(Date.now() - sinceHours * 3600 * 1000);
  return prisma.breakGlassSession.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function listOutstandingDelegatedAuthorities() {
  return prisma.delegatedTenantAuthority.findMany({
    where: { status: { in: ["proposed", "approved", "active", "suspended"] } },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });
}

export async function summariseCrossTenantAccess() {
  const [breakGlass, delegated] = await Promise.all([
    listRecentBreakGlassSessions(),
    listOutstandingDelegatedAuthorities(),
  ]);
  const active = breakGlass.filter((s) => s.status === "active");
  const expired = breakGlass.filter(
    (s) => s.status === "active" && s.expiresAt.getTime() < Date.now()
  );
  return {
    totalBreakGlass: breakGlass.length,
    activeBreakGlass: active.length,
    expiredButNotRevoked: expired.length,
    outstandingDelegations: delegated.length,
    generatedAt: new Date().toISOString(),
  };
}
