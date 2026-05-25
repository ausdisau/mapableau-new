import { prisma } from "@/lib/prisma";

import { AGGREGATE_MIN_CELL_SIZE } from "./unmet-need-access-policy";

export async function refreshUnmetNeedAggregates() {
  const records = await prisma.unmetNeedRecord.groupBy({
    by: ["regionKey", "needType"],
    _count: { id: true },
  });

  for (const row of records) {
    const count = row._count.id;
    const suppressed = count < AGGREGATE_MIN_CELL_SIZE;
    const regionKey = row.regionKey ?? "unknown";
    const existing = await prisma.unmetNeedAggregate.findFirst({
      where: { regionKey, needType: row.needType },
    });
    const data = {
      regionKey: suppressed ? "generalised" : regionKey,
      needType: row.needType,
      count: suppressed ? 0 : count,
      periodStart: new Date(Date.now() - 90 * 86400000),
      periodEnd: new Date(),
      suppressed,
    };
    if (existing) {
      await prisma.unmetNeedAggregate.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.unmetNeedAggregate.create({ data });
    }
  }

  return records.length;
}

export async function listServiceGapsForAdmin() {
  const aggregates = await prisma.unmetNeedAggregate.findMany({
    where: { suppressed: false },
    orderBy: { count: "desc" },
    take: 50,
  });
  return aggregates;
}
