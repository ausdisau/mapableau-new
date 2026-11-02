import { describe, expect, it } from "vitest";

import { applyAction, seedWorkspace } from "@mapable/adtunis-core";

/**
 * Participant isolation for in-memory fallback used when Prisma is unavailable.
 * Live route handlers key workspaces by authenticated NextAuth user id.
 */
describe("adtunis participant isolation contract", () => {
  it("keeps separate workspace objects from mutating each other", () => {
    const a = seedWorkspace();
    const b = seedWorkspace();
    applyAction(a, {
      type: "confirmExpression",
      text: "Message for participant A",
    });
    expect(b.recognitions).toHaveLength(0);
    expect(a.recognitions[0]?.confirmed).toBe("Message for participant A");
  });
});
