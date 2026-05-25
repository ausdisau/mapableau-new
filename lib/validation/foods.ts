import { z } from "zod";

export const foodSubstitutionPolicySchema = z.enum([
  "allow_similar",
  "contact_first",
  "no_substitutions",
  "vendor_choice",
]);

export const addCartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive().max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(99),
});

export const checkoutSchema = z
  .object({
    deliveryAddressFull: z.string().min(5).max(500),
    deliveryAddressSuburb: z.string().min(2).max(120),
    deliveryAddressId: z.string().optional(),
    deliveryWindowStart: z.string().datetime(),
    deliveryWindowEnd: z.string().datetime(),
    handoverInstructions: z.record(z.string(), z.unknown()).optional(),
    substitutionPolicy: foodSubstitutionPolicySchema.optional(),
    allergenAcknowledged: z.boolean(),
    deliveryFeeAmount: z.number().int().nonnegative().optional(),
    preparationFeeAmount: z.number().int().nonnegative().optional(),
    supportFeeAmount: z.number().int().nonnegative().optional(),
    nomineeId: z.string().cuid().optional(),
  })
  .refine((d) => new Date(d.deliveryWindowEnd) > new Date(d.deliveryWindowStart), {
    message: "Delivery window end must be after start",
    path: ["deliveryWindowEnd"],
  })
  .refine((d) => d.allergenAcknowledged === true, {
    message: "You must acknowledge allergen information before checkout",
    path: ["allergenAcknowledged"],
  });

export const createProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  category: z.string().min(1).max(100),
  productType: z.enum([
    "grocery",
    "prepared_meal",
    "meal_bundle",
    "household_essential",
  ]),
  priceAmount: z.number().int().positive(),
  currency: z.string().length(3).default("AUD"),
  dietaryTags: z.array(z.string()).optional(),
  allergenTags: z.array(z.string()).optional(),
  accessibilityTags: z.array(z.string()).optional(),
  nutritionSummary: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const assignDeliverySchema = z.object({
  driverUserId: z.string().cuid(),
});

export const handoverSchema = z.object({
  checklist: z.record(z.string(), z.unknown()),
  photoUrl: z.string().url().optional(),
  recipientName: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const disputeSchema = z.object({
  reason: z.string().min(10).max(2000),
});

export const reportIssueSchema = z.object({
  description: z.string().min(10).max(5000),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export const preferencesSchema = z.object({
  dietaryPreferences: z.array(z.string()).optional(),
  accessibilityPreferences: z.array(z.string()).optional(),
  communicationPreferences: z.record(z.string(), z.unknown()).optional(),
  deliveryNotes: z.string().max(2000).optional(),
});

export const allergyProfileSchema = z.object({
  allergens: z.array(z.string()).min(0),
  severityNotes: z.string().max(2000).optional(),
});

export const inventoryUpdateSchema = z.object({
  productId: z.string().cuid(),
  quantityOnHand: z.number().int().nonnegative(),
});
