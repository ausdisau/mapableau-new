import { describe, expect, it } from "vitest";

import {
  MockMessagingAdapter,
  recordDelivery,
  seedWorkspace,
} from "@mapable/adtunis-core";

describe("adtunis messaging delivery", () => {
  it("labels mock delivery as not sent", async () => {
    const adapter = new MockMessagingAdapter();
    const result = await adapter.deliver({
      participantId: "user-1",
      expression: "I need support this afternoon.",
      idempotencyKey: "idem-1",
    });
    expect(result.simulated).toBe(true);
    expect(result.mode).toBe("mock");
    expect(result.label.toLowerCase()).toContain("simulated");
    expect(result.label.toLowerCase()).toContain("not sent");
  });

  it("records delivery on the workspace without implying live send for mock mode", () => {
    const state = seedWorkspace();
    const next = recordDelivery(state, {
      id: "mock-1",
      mode: "mock",
      label: "Simulated delivery — not sent.",
      conversationId: null,
      expression: "Hello",
      createdAt: new Date().toISOString(),
    });
    expect(next.lastDelivery?.mode).toBe("mock");
    expect(next.activity[0]?.title.toLowerCase()).toContain("simulated");
  });

  it("requires explicit confirmation payload shape for external actions", async () => {
    const { intentConfirmationSchema } = await import("@mapable/adtunis-core");
    expect(() =>
      intentConfirmationSchema.parse({
        expression: "Please help",
        idempotencyKey: "short",
        confirmed: true,
      }),
    ).toThrow();
    expect(
      intentConfirmationSchema.parse({
        expression: "Please help",
        idempotencyKey: "idempotency-key-1",
        confirmed: true,
      }).confirmed,
    ).toBe(true);
  });
});
