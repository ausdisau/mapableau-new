import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { executeSaveParticipantPreference } from "@/lib/ai/platform/actions/adapters";
import {
  clearAgencyMemoryStore,
  listUsableForPersonalisation,
} from "@/lib/ai/platform/agency-memory";

vi.mock("@/intelligence/preferences/preference-service", () => ({
  upsertCareOSPreference: vi.fn(async () => undefined),
}));

describe("Agency Memory — Action Kernel bridge", () => {
  beforeEach(() => {
    clearAgencyMemoryStore();
    process.env.MAPABLE_AGENCY_MEMORY_ENABLED = "true";
  });

  afterEach(() => {
    clearAgencyMemoryStore();
    delete process.env.MAPABLE_AGENCY_MEMORY_ENABLED;
    vi.clearAllMocks();
  });

  it("save_participant_preference creates confirmed Agency Memory item", async () => {
    const result = await executeSaveParticipantPreference(
      {
        key: "preferred_contact_method",
        value: "sms",
        expiresAt: null,
      },
      {
        participantId: "p1",
        actorId: "p1",
        user: { id: "p1" } as never,
        idempotencyKey: "idem-1",
      },
    );

    expect(result.entityType).toBe("MapAbleAgencyMemoryItem");
    const usable = listUsableForPersonalisation({
      participantId: "p1",
      tenantId: "p1",
    });
    expect(usable).toHaveLength(1);
    expect(usable[0]!.category).toBe("communication");
    expect(usable[0]!.confirmationState).toBe("confirmed");
  });
});
