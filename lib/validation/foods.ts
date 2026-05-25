import { z } from "zod";

export const foodSubstitutionPolicySchema = z.enum([
  "no_substitutions",
  "contact_me",
  "closest_match",
  "provider_choice",
]);

export const handoverInstructionsSchema = z.object({
  leaveAtDoor: z.boolean().optional(),
  knockOrCall: z.enum(["knock", "call", "either"]).optional(),
  supportPersonName: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export const foodProductQuerySchema = z.object({
  q: z.string().optional(),
  productType: z
    .enum(["grocery", "prepared_meal", "meal_bundle", "household_essential"])
    .optional(),
  dietary: z.string().optional(),
  accessibility: z.string().optional(),
});

export const providerProductSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  productType: z.enum([
    "grocery",
    "prepared_meal",
    "meal_bundle",
    "household_essential",
  ]),
  priceCents: z.number().int().nonnegative(),
  preparationFeeCents: z.number().int().nonnegative().optional(),
  deliveryFeeCents: z.number().int().nonnegative().optional(),
  supportFeeCents: z.number().int().nonnegative().optional(),
  dietaryTags: z.array(z.string().min(1).max(60)).optional(),
  allergenTags: z.array(z.string().min(1).max(60)).optional(),
  accessibilityTags: z.array(z.string().min(1).max(60)).optional(),
  inventoryCount: z.number().int().nonnegative().optional(),
  published: z.boolean().optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z
  .object({
    vendorId: z.string().cuid(),
    deliveryAddressFull: z.string().min(5).max(500),
    deliveryAddressSuburb: z.string().min(2).max(120).optional(),
    deliveryAddressState: z.string().max(20).optional(),
    deliveryAddressPostcode: z.string().max(20).optional(),
    deliveryInstructions: z.string().max(1000).optional(),
    deliveryWindowStart: z.string().datetime(),
    deliveryWindowEnd: z.string().datetime(),
    substitutionPolicy: foodSubstitutionPolicySchema.default("contact_me"),
    allergenAcknowledged: z.boolean(),
    handoverInstructions: handoverInstructionsSchema.optional(),
  })
  .refine(
    (input) => new Date(input.deliveryWindowEnd) > new Date(input.deliveryWindowStart),
    {
      path: ["deliveryWindowEnd"],
      message: "Delivery window end must be after start",
    }
  );

export const updateFoodOrderStatusSchema = z.object({
  status: z.enum([
    "confirmed",
    "preparing",
    "packed",
    "assigned",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "disputed",
  ]),
  message: z.string().max(500).optional(),
});

export const assignFoodDeliverySchema = z.object({
  driverUserId: z.string().cuid().optional(),
  driverDisplayName: z.string().max(200).optional(),
  handoverInstructions: handoverInstructionsSchema.optional(),
});

export const updateFoodDeliveryStatusSchema = z.object({
  status: z.enum([
    "picked_up",
    "out_for_delivery",
    "arrived",
    "delivered",
    "failed",
    "cancelled",
    "disputed",
  ]),
  message: z.string().max(500).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const foodDisputeSchema = z.object({
  reason: z.string().min(5).max(1000),
});

export const foodSafetyIssueSchema = z.object({
  category: z.string().min(2).max(120),
  description: z.string().min(5).max(2000),
  createsDispute: z.boolean().optional(),
});

export const foodPreferencesSchema = z.object({
  dietaryPreferences: z.array(z.string().max(60)).default([]),
  texturePreferences: z.array(z.string().max(60)).default([]),
  accessibilityNotes: z.string().max(1000).optional(),
  notificationOptInAmounts: z.boolean().optional(),
  allergens: z.array(z.string().max(80)).default([]),
  severityNotes: z.string().max(1000).optional(),
  emergencyPlan: z.string().max(1000).optional(),
  shareWithVendors: z.boolean().optional(),
  shareWithDrivers: z.boolean().optional(),
  substitutionPolicy: foodSubstitutionPolicySchema.optional(),
});
