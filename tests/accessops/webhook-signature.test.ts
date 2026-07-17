import { describe, expect, it } from "vitest";

import {
  signWebhookPayload,
  verifyWebhookSignature,
} from "@/lib/accessops/partners/webhook-signature";

describe("AccessOps webhook signatures", () => {
  it("verifies signed payloads and rejects changed payloads", () => {
    const signature = signWebhookPayload("secret", "{\"event\":\"status\"}");
    expect(verifyWebhookSignature("secret", "{\"event\":\"status\"}", signature)).toBe(true);
    expect(verifyWebhookSignature("secret", "{\"event\":\"changed\"}", signature)).toBe(false);
  });
});
