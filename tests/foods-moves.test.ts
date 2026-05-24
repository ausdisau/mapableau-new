import { describe, expect, it } from "vitest";

import { calculateSplitFromItems } from "@/lib/foods/food-invoice-split-service";

describe("foods invoice split", () => {
  it("sums ingredient, preparation, and delivery", () => {
    const split = calculateSplitFromItems(
      [
        {
          id: "1",
          foodOrderId: "o1",
          menuItemId: "m1",
          quantity: 2,
          unitIngredientCents: 100,
          unitPreparationCents: 50,
          menuItem: {
            id: "m1",
            name: "Test",
            description: null,
            ingredients: "x",
            textureLevel: "standard",
            nutritionSummary: null,
            preparationRequired: true,
            storageInstructions: null,
            reheatingInstructions: null,
            ingredientCostCents: 100,
            preparationCostCents: 50,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      500,
    );
    expect(split.ingredientCents).toBe(200);
    expect(split.preparationCents).toBe(100);
    expect(split.deliveryCents).toBe(500);
    expect(split.totalCents).toBe(800);
    expect(split.plainLanguageNote).toContain("split");
  });
});

describe("allergy confirmation", () => {
  it("requires literal true in schema", async () => {
    const { createFoodOrderSchema } = await import("@/lib/validation/foods");
    const fail = createFoodOrderSchema.safeParse({
      items: [{ menuItemId: "a", quantity: 1 }],
      allergyConfirmed: false,
    });
    expect(fail.success).toBe(false);
    const ok = createFoodOrderSchema.safeParse({
      items: [{ menuItemId: "a", quantity: 1 }],
      allergyConfirmed: true,
    });
    expect(ok.success).toBe(true);
  });
});
