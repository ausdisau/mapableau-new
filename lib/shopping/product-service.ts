import type { Prisma, ShopProductCategory } from "@prisma/client";

import type { ShopProductSummary } from "@/types/shopping";
import { prisma } from "@/lib/prisma";

const productSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  category: true,
  status: true,
  unitAmountCents: true,
  currency: true,
  gstApplicable: true,
  stockQuantity: true,
  imageUrls: true,
  accessibilityNotes: true,
  ndisRelevant: true,
} satisfies Prisma.ShopProductSelect;

function mapProduct(row: Prisma.ShopProductGetPayload<{ select: typeof productSelect }>): ShopProductSummary {
  const imageUrls = Array.isArray(row.imageUrls)
    ? (row.imageUrls as string[])
    : [];

  return {
    ...row,
    imageUrls,
  };
}

export async function listPublishedProducts(options: {
  category?: ShopProductCategory;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 12;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ShopProductWhereInput = {
    status: "published",
    ...(options.category ? { category: options.category } : {}),
    ...(options.q
      ? {
          OR: [
            { title: { contains: options.q, mode: "insensitive" } },
            { description: { contains: options.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.shopProduct.findMany({
      where,
      select: productSelect,
      orderBy: { title: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.shopProduct.count({ where }),
  ]);

  return {
    items: items.map(mapProduct),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPublishedProductBySlug(slug: string) {
  const row = await prisma.shopProduct.findFirst({
    where: { slug, status: "published" },
    select: productSelect,
  });
  return row ? mapProduct(row) : null;
}

export async function getProductById(productId: string) {
  const row = await prisma.shopProduct.findUnique({
    where: { id: productId },
    select: productSelect,
  });
  return row ? mapProduct(row) : null;
}

export async function listAllProductsForAdmin() {
  const rows = await prisma.shopProduct.findMany({
    select: productSelect,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapProduct);
}

export async function createProduct(
  input: Prisma.ShopProductCreateInput | Prisma.ShopProductUncheckedCreateInput
) {
  const row = await prisma.shopProduct.create({
    data: input,
    select: productSelect,
  });
  return mapProduct(row);
}

export async function updateProduct(
  productId: string,
  input: Prisma.ShopProductUpdateInput | Prisma.ShopProductUncheckedUpdateInput
) {
  const row = await prisma.shopProduct.update({
    where: { id: productId },
    data: input,
    select: productSelect,
  });
  return mapProduct(row);
}

export async function getProductsForCartValidation(productIds: string[]) {
  return prisma.shopProduct.findMany({
    where: { id: { in: productIds }, status: "published" },
    select: {
      id: true,
      slug: true,
      title: true,
      unitAmountCents: true,
      gstApplicable: true,
      ndisRelevant: true,
      stockQuantity: true,
      currency: true,
    },
  });
}
