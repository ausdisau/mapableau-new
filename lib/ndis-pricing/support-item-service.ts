import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { supportItemSearchSchema } from "@/types/ndis-pricing";
import type { z } from "zod";

export type SupportItemSearchInput = z.infer<typeof supportItemSearchSchema>;

export async function searchSupportItems(input: SupportItemSearchInput) {
  const and: Prisma.NdisSupportItemWhereInput[] = [];

  if (input.activeOnly) and.push({ active: true });
  if (input.category) {
    and.push({
      OR: [
        { categoryLabel: { contains: input.category, mode: "insensitive" } },
        { category: { name: { contains: input.category, mode: "insensitive" } } },
      ],
    });
  }
  if (input.registrationGroup) {
    and.push({
      registrationGroup: {
        contains: input.registrationGroup,
        mode: "insensitive",
      },
    });
  }
  if (input.serviceType) {
    and.push({ serviceTypes: { has: input.serviceType } });
  }
  if (input.q?.trim()) {
    const q = input.q.trim();
    and.push({
      OR: [
        { code: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const where = and.length ? { AND: and } : {};

  const [items, total] = await Promise.all([
    prisma.ndisSupportItem.findMany({
      where,
      include: {
        category: true,
        registrationGroupRef: true,
        cataloguePrices: {
          orderBy: { effectiveFrom: "desc" },
          take: 1,
          include: { version: { include: { catalogue: true } } },
        },
      },
      orderBy: { code: "asc" },
      take: input.limit,
      skip: input.offset,
    }),
    prisma.ndisSupportItem.count({ where }),
  ]);

  return { items, total, limit: input.limit, offset: input.offset };
}

export async function getSupportItemByCode(code: string) {
  const item = await prisma.ndisSupportItem.findUnique({
    where: { code },
    include: {
      category: true,
      registrationGroupRef: true,
      cataloguePrices: {
        orderBy: { effectiveFrom: "desc" },
        take: 5,
        include: { version: { include: { catalogue: true } } },
      },
    },
  });
  if (!item) return null;

  const warnings: string[] = [];
  if (!item.cataloguePrices.length) {
    warnings.push("No catalogue price on file for this item — review manually.");
  }

  return { item, warnings, disclaimer: "Catalogue data is informational only." };
}

export function toSupportItemSummary(
  item: Awaited<ReturnType<typeof searchSupportItems>>["items"][number]
) {
  const latestPrice = item.cataloguePrices[0];
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    categoryLabel: item.categoryLabel ?? item.category?.name,
    registrationGroup: item.registrationGroup,
    unitType: item.unitType ?? latestPrice?.unitType,
    priceCapCents: latestPrice?.priceCapCents ?? item.priceCapCents,
    active: item.active,
    serviceTypes: item.serviceTypes,
    providerTypes: item.providerTypes,
    versionLabel: latestPrice?.version?.version,
    catalogueName: latestPrice?.version?.catalogue?.name,
  };
}
