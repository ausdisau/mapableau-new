import { prisma } from "@/lib/prisma";

export async function listPublishedProducts(params: {
  category?: string;
  productType?: string;
  dietaryTag?: string;
  accessibilityTag?: string;
  vendorId?: string;
  q?: string;
}) {
  const where: Record<string, unknown> = { status: "published" };
  if (params.category) where.category = params.category;
  if (params.productType) where.productType = params.productType;
  if (params.vendorId) where.vendorId = params.vendorId;
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const products = await prisma.foodProduct.findMany({
    where: where as never,
    orderBy: { title: "asc" },
    take: 100,
    include: { vendor: { select: { id: true, displayName: true } } },
  });

  return products.filter((p) => {
    if (params.dietaryTag) {
      const tags = p.dietaryTags as string[];
      if (!tags.includes(params.dietaryTag)) return false;
    }
    if (params.accessibilityTag) {
      const tags = p.accessibilityTags as string[];
      if (!tags.includes(params.accessibilityTag)) return false;
    }
    return true;
  });
}

export async function getProduct(productId: string) {
  return prisma.foodProduct.findFirst({
    where: { id: productId, status: "published" },
    include: { mealItems: true, vendor: { select: { displayName: true } } },
  });
}

export async function createVendorProduct(
  vendorId: string,
  data: {
    title: string;
    description?: string;
    category: string;
    productType: "grocery" | "prepared_meal" | "meal_bundle" | "household_essential";
    priceAmount: number;
    currency?: string;
    dietaryTags?: string[];
    allergenTags?: string[];
    accessibilityTags?: string[];
    nutritionSummary?: string;
    imageUrl?: string;
  }
) {
  return prisma.foodProduct.create({
    data: {
      vendorId,
      title: data.title,
      description: data.description,
      category: data.category,
      productType: data.productType,
      priceAmount: data.priceAmount,
      currency: data.currency ?? "AUD",
      dietaryTags: data.dietaryTags ?? [],
      allergenTags: data.allergenTags ?? [],
      accessibilityTags: data.accessibilityTags ?? [],
      nutritionSummary: data.nutritionSummary,
      imageUrl: data.imageUrl,
      status: "draft",
    },
  });
}

export async function updateVendorProduct(
  vendorId: string,
  productId: string,
  data: Partial<{
    title: string;
    description: string;
    category: string;
    productType: "grocery" | "prepared_meal" | "meal_bundle" | "household_essential";
    priceAmount: number;
    dietaryTags: string[];
    allergenTags: string[];
    accessibilityTags: string[];
    nutritionSummary: string;
    imageUrl: string;
  }>
) {
  const existing = await prisma.foodProduct.findFirst({
    where: { id: productId, vendorId },
  });
  if (!existing) throw new Error("PRODUCT_NOT_FOUND");
  return prisma.foodProduct.update({
    where: { id: productId },
    data: data as never,
  });
}

export async function publishProduct(vendorId: string, productId: string) {
  const product = await prisma.foodProduct.findFirst({
    where: { id: productId, vendorId },
  });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  return prisma.foodProduct.update({
    where: { id: productId },
    data: { status: "published" },
  });
}
