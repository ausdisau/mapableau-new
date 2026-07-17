/**
 * Wave 11 — Continuity monitoring.
 *
 * Counts open cases by category / participant / organisation for the
 * admin/reliability dashboard.
 */

import { prisma } from "@/lib/prisma";

export async function countOpenCasesByCategory(organisationId: string) {
  const rows = await prisma.continuityCase.groupBy({
    by: ["category"],
    where: {
      organisationId,
      status: { notIn: ["closed", "abandoned", "resolved"] },
    },
    _count: { _all: true },
  });
  return rows.map((r) => ({ category: r.category, count: r._count._all }));
}

export async function countRecentSignalsByKind(organisationId: string, sinceHours = 24) {
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
  const rows = await prisma.continuitySignal.groupBy({
    by: ["kind"],
    where: {
      organisationId,
      observedAt: { gte: since },
    },
    _count: { _all: true },
  });
  return rows.map((r) => ({ kind: r.kind, count: r._count._all, since }));
}
