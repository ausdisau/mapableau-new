import { z } from "zod";

export const cocktailsListSchema = z.object({
  cocktails: z.array(
    z.object({
      name: z.string().describe("Name of a cocktail."),
      ingredients: z.array(z.string().describe("Ingredient of a cocktail.")),
      instructions: z.string().describe("Instructions to make a cocktail."),
    })
  ),
});

export type CocktailsList = z.infer<typeof cocktailsListSchema>;
