import { describe, expect, it } from "vitest";

import { cocktailsListSchema } from "@/lib/ai/stream-object-schema";

describe("cocktailsListSchema", () => {
  it("accepts a valid cocktails list", () => {
    const result = cocktailsListSchema.safeParse({
      cocktails: [
        {
          name: "Sunrise Spritz",
          ingredients: ["aperol", "prosecco", "soda"],
          instructions: "Build in a wine glass over ice.",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing cocktails array", () => {
    const result = cocktailsListSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
