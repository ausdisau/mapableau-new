import { describe, expect, it } from "vitest";

import {
  buildProviderSearchFilters,
  parseProviderChatIntent,
} from "@/lib/provider/finder/provider-chat-matching";
import type { ProviderSearchPreferences } from "@/lib/provider/finder/search-profile-contract";

const saved: ProviderSearchPreferences = {
  state: "VIC",
  postcode: "3000",
  suburb: "Melbourne",
  serviceTypes: ["therapy"],
  communicationModes: ["AAC"],
  delivery: "home_visit",
  fundingManagement: "plan",
};

describe("provider conversational search intent", () => {
  it("recognises a known registration-group category and location without inventing worker identities", () => {
    expect(parseProviderChatIntent("Find support coordination near St Ives NSW")).toEqual(
      expect.objectContaining({
        state: "NSW",
        suburb: "St Ives",
        serviceType: "support_coordination",
        workerIntent: false,
      }),
    );
  });

  it("classifies worker requests only as provider-service requests", () => {
    const intent = parseProviderChatIntent("Find a disability support worker in 2075");
    expect(intent.workerIntent).toBe(true);
    expect(intent.serviceType).toBe("daily_life");
    expect(intent.postcode).toBe("2075");
  });

  it("does not treat near me as a resolved location", () => {
    expect(parseProviderChatIntent("Find carers near me").suburb).toBeUndefined();
  });

  it("does not combine user-specified location with a contradictory saved postcode", () => {
    const filters = buildProviderSearchFilters({
      intent: parseProviderChatIntent("Find support coordination in NSW"),
      saved,
      usedSavedProfile: true,
    });
    expect(filters.state).toBe("NSW");
    expect(filters.postcode).toBeUndefined();
    expect(filters.suburb).toBeUndefined();
    expect(filters.serviceTypes).toEqual(["support_coordination"]);
    expect(filters.communicationModes).toEqual(["AAC"]);
    expect(filters.delivery).toBe("home_visit");
  });

  it("never applies stored preferences unless they were explicitly passed to the builder", () => {
    const filters = buildProviderSearchFilters({
      intent: parseProviderChatIntent("Find support workers"),
      usedSavedProfile: false,
    });
    expect(filters.state).toBeUndefined();
    expect(filters.communicationModes).toEqual([]);
    expect(filters.serviceTypes).toEqual(["daily_life"]);
  });
});
