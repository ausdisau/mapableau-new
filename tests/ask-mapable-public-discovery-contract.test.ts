import { describe, expect, it } from "vitest";

import {
  mapPublicDirectoryEntries,
  publicCompanionFlags,
  publicDiscoveryRequest,
} from "@/lib/ask-mapable/agents/public-discovery-contract";

describe("MapAble public companion SDK contract", () => {
  it("rejects hidden/implicit external-model consent", () => {
    expect(publicDiscoveryRequest.safeParse({ query: "support providers near Sydney" }).success).toBe(false);
    expect(publicDiscoveryRequest.safeParse({
      query: "support providers near Sydney", externalAiApproved: false,
    }).success).toBe(false);
    expect(publicDiscoveryRequest.safeParse({
      query: "support providers near Sydney", externalAiApproved: true,
    }).success).toBe(true);
  });

  it("rejects malformed state, postcode, and excessive text", () => {
    expect(publicDiscoveryRequest.safeParse({
      query: "support", state: "INVALID", externalAiApproved: true,
    }).success).toBe(false);
    expect(publicDiscoveryRequest.safeParse({
      query: "support", postcode: "20000", externalAiApproved: true,
    }).success).toBe(false);
    expect(publicDiscoveryRequest.safeParse({
      query: "a".repeat(241), externalAiApproved: true,
    }).success).toBe(false);
  });

  it("defaults the Agents SDK path OFF independent of the guest widget", () => {
    expect(publicCompanionFlags.agentEnabled({})).toBe(false);
    expect(publicCompanionFlags.directoryEnabled({})).toBe(false);
    expect(publicCompanionFlags.isReadyForApprovedRun({
      NEXT_PUBLIC_MAPABLE_PUBLIC_ACCESS_ASSISTANT_ENABLED: "true",
      OPENAI_API_KEY: "not_a_real_key",
      MAPABLE_PUBLIC_COMPANION_MODEL: "test-only",
    })).toBe(false);
  });

  it("requires both the server agent flag and server model configuration", () => {
    expect(publicCompanionFlags.isReadyForApprovedRun({
      MAPABLE_PUBLIC_COMPANION_AGENT_ENABLED: "true",
      OPENAI_API_KEY: "test-only-key",
      MAPABLE_PUBLIC_COMPANION_MODEL: "test-only-model",
    })).toBe(true);
    expect(publicCompanionFlags.isReadyForApprovedRun({
      MAPABLE_PUBLIC_COMPANION_AGENT_ENABLED: "true",
      MAPABLE_PUBLIC_COMPANION_MODEL: "test-only-model",
    })).toBe(false);
  });

  it("only returns public directory fields; never emits worker or ads metadata", () => {
    const rows = [
      {
        source_id: "synthetic-123",
        provider_name: "Synthetic Test Provider",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        phone: "not-to-be-used",
        workerIds: ["worker-secret"],
        advertBid: 1000,
      },
    ];
    const records = mapPublicDirectoryEntries(rows);
    expect(records).toHaveLength(1);
    expect(records[0]?.sourceLabel).toBe("Imported NDIS provider outlet directory snapshot");
    expect(records[0]?.registrationStatus).toBe("not_currently_verified");
    expect(records[0]?.workerScreeningStatus).toBe("not_checked");
    expect(records[0]?.accessFit).toBe("unknown");
    expect(records[0]?.availability).toBe("unknown");
    expect("workerIds" in records[0]!).toBe(false);
    expect("phone" in records[0]!).toBe(false);
    expect("advertBid" in records[0]!).toBe(false);
  });

  it("drops repeated and incomplete imported outlet entries", () => {
    const records = mapPublicDirectoryEntries([
      { source_id: "x1", provider_name: "First", suburb: null, state: null, postcode: null },
      { source_id: "x1", provider_name: "Duplicate", suburb: null, state: null, postcode: null },
      { source_id: "", provider_name: "Broken", suburb: null, state: null, postcode: null },
    ]);
    expect(records.map((item) => item.name)).toEqual(["First"]);
  });
});
