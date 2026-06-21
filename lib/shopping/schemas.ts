import { z } from "zod";

export const shopProductCategorySchema = z.enum([
  "assistive_technology",
  "daily_living",
  "mobility",
  "communication",
]);

export const shopProductStatusSchema = z.enum(["draft", "published", "archived"]);

export const createShopProductSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: shopProductCategorySchema,
  status: shopProductStatusSchema.optional(),
  unitAmountCents: z.number().int().positive(),
  currency: z.string().length(3).optional(),
  gstApplicable: z.boolean().optional(),
  stockQuantity: z.number().int().nonnegative().nullable().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  accessibilityNotes: z.string().max(2000).nullable().optional(),
  ndisRelevant: z.boolean().optional(),
  vendorOrganisationId: z.string().cuid().nullable().optional(),
});

export const updateShopProductSchema = createShopProductSchema.partial();

export const listProductsQuerySchema = z.object({
  category: shopProductCategorySchema.optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const cartItemMutationSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(0).max(99),
});

export const checkoutSchema = z.object({
  fundingSourceId: z.string().cuid(),
  shippingName: z.string().min(1).max(200).optional(),
  shippingEmail: z.string().email().optional(),
  shippingAddress: z
    .object({
      line1: z.string().min(1).max(200),
      line2: z.string().max(200).optional(),
      suburb: z.string().min(1).max(100),
      state: z.string().min(2).max(20),
      postcode: z.string().min(3).max(10),
      country: z.string().min(2).max(60).default("Australia"),
    })
    .optional(),
});
