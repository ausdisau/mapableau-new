import { createHmac } from "crypto";

import { afterEach, describe, expect, it } from "vitest";

import { verifyN8nWebhookSignature } from "@/lib/automation/n8n/n8n-webhook-service";

describe("n8n webhook HMAC signature verification", () => {
  const previous = process.env.N8N_WEBHOOK_SECRET;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.N8N_WEBHOOK_SECRET;
    } else {
      process.env.N8N_WEBHOOK_SECRET = previous;
    }
  });

  it("accepts a valid HMAC-SHA256 hex signature", () => {
    process.env.N8N_WEBHOOK_SECRET = "test-secret-value";
    const body = JSON.stringify({ eventKey: "ping", payload: {} });
    const signature = createHmac("sha256", "test-secret-value")
      .update(body, "utf8")
      .digest("hex");
    expect(verifyN8nWebhookSignature(body, signature)).toBe(true);
    expect(verifyN8nWebhookSignature(body, `sha256=${signature}`)).toBe(true);
  });

  it("rejects missing signature, wrong signature, and missing secret", () => {
    process.env.N8N_WEBHOOK_SECRET = "test-secret-value";
    const body = '{"eventKey":"ping"}';
    expect(verifyN8nWebhookSignature(body, null)).toBe(false);
    expect(verifyN8nWebhookSignature(body, "deadbeef")).toBe(false);

    delete process.env.N8N_WEBHOOK_SECRET;
    const signature = createHmac("sha256", "test-secret-value")
      .update(body, "utf8")
      .digest("hex");
    expect(verifyN8nWebhookSignature(body, signature)).toBe(false);
  });
});
