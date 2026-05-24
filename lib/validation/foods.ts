import { z } from "zod";

export const dietaryProfileSchema = z.object({
  allergies: z.array(z.string()).default([]),
  intolerances: z.array(z.string()).default([]),
  culturalPreferences: z.array(z.string()).default([]),
  textureRequirement: z
    .enum(["standard", "soft", "minced_moist", "pureed", "liquidised"])
    .optional(),
  swallowingRiskFlag: z.boolean().optional(),
  preferredMealTimes: z.array(z.string()).optional(),
  supportRequiredForMeals: z.boolean().optional(),
  nomineeCanOrder: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

export const createFoodOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  deliveryAddress: z.string().min(3).optional(),
  participantNotes: z.string().max(1000).optional(),
  allergyConfirmed: z.literal(true),
});

export const mealPlanSchema = z.object({
  name: z.string().min(2).max(100),
  items: z.array(
    z.object({
      menuItemId: z.string(),
      quantity: z.number().int().min(1),
      dayOfWeek: z.number().int().min(0).max(6).optional(),
    }),
  ),
});

export const scheduleDeliverySchema = z.object({
  scheduledAt: z.string().datetime(),
  deliveryAddress: z.string().min(3),
  temperatureLog: z.string().optional(),
});
