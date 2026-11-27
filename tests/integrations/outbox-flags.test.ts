import { afterEach, describe, expect, it, vi } from "vitest";

import {
  integrationOutboxFlags,
  isIntegrationOutboxLive,
} from "@/lib/integrations/outbox/flags";
import {
  enqueueIntegrationOutbox,
  resetIntegrationOutboxForTests,
} from "@/lib/integrations/outbox/memory-outbox";

afterEach(() => {
  vi.unstubAllEnvs();
  resetIntegrationOutboxForTests();
});

describe("integration outbox flags", () => {
  it("defaults fail-closed / dry-run", () => {
    expect(integrationOutboxFlags.outboxEnabled).toBe(false);
    expect(integrationOutboxFlags.dryRun).toBe(true);
    expect(integrationOutboxFlags.deputyEnabled).toBe(false);
    expect(isIntegrationOutboxLive()).toBe(false);
  });

  it("enqueues needs_review when outbox disabled", () => {
    const row = enqueueIntegrationOutbox({
      provider: "stripe",
      aggregateType: "BillingInvoice",
      aggregateId: "inv_1",
      dedupeKey: "stripe:inv_1:draft",
    });
    expect(row.state).toBe("needs_review");
  });
});
