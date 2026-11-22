import { describe, expect, it } from "vitest";

import {
  MAPABLE_DIRECTORY_QUERY,
  directoryVariables,
  federatedDirectoryFlags,
  persistedDirectoryOperation,
  queryPublicDirectory,
  toDirectoryGraph,
  type PublicDirectoryProvider,
  type PublicDirectorySource,
} from "@/lib/mapable-search/federated-public-directory";

const sample: PublicDirectoryProvider = {
  id: "fixture-1",
  name: "Synthetic Access Service",
  state: "NSW",
  locality: "Sydney",
  source: "neon",
  evidenceStatus: "imported_or_self_described",
  registrationStatus: "not_currently_verified",
  availability: "unknown",
};

function adapter(
  name: "neon" | "supabase",
  rows: PublicDirectoryProvider[],
): PublicDirectorySource {
  return { name, search: async () => rows };
}

describe("MapAble Search allowlisted public operation", () => {
  const canonical = {
    operationName: "MapAbleDirectory",
    query: MAPABLE_DIRECTORY_QUERY,
    variables: { text: "support", state: "NSW", limit: 5 },
  };

  it("accepts only the known GraphQL document and safe variables", () => {
    expect(persistedDirectoryOperation.safeParse(canonical).success).toBe(true);
    expect(persistedDirectoryOperation.safeParse({
      ...canonical, query: "{ __schema { types { name } } }",
    }).success).toBe(false);
    expect(persistedDirectoryOperation.safeParse({
      ...canonical, query: "mutation { deleteProvider(id: 1) }",
    }).success).toBe(false);
    expect(persistedDirectoryOperation.safeParse({
      ...canonical, variables: { text: "care", limit: 20, participantId: "secret" },
    }).success).toBe(false);
    expect(directoryVariables.safeParse({ text: "x", limit: 100 }).success).toBe(false);
  });

  it("remains server-flagged OFF by default, with separate source switches", () => {
    expect(federatedDirectoryFlags({})).toEqual({
      endpoint: false, neon: false, supabase: false,
    });
    expect(federatedDirectoryFlags({
      MAPABLE_FEDERATED_DIRECTORY_ENABLED: "true",
    })).toEqual({ endpoint: true, neon: false, supabase: false });
  });

  it("never calls a disabled external source or includes private/ad metadata", async () => {
    const malicious = {
      ...sample,
      sponsorBid: 999,
      participantId: "do-not-include",
      workerId: "private-worker",
      phone: "private",
    };
    const supabase = {
      name: "supabase" as const,
      search: async () => { throw new Error("disabled connector was called"); },
    };
    const result = await queryPublicDirectory(
      { text: "access", limit: 10 },
      [{ enabled: true, adapter: adapter("neon", [malicious]) },
       { enabled: false, adapter: supabase }],
    );
    expect(result.sources).toEqual({ neon: "ok", supabase: "disabled" });
    expect(result.providers).toHaveLength(1);
    expect("sponsorBid" in result.providers[0]!).toBe(false);
    expect("participantId" in result.providers[0]!).toBe(false);
    expect("phone" in result.providers[0]!).toBe(false);
  });

  it("returns partial source-labelled results if Supabase is unavailable", async () => {
    const result = await queryPublicDirectory(
      { text: "access", limit: 10 },
      [
        { enabled: true, adapter: adapter("neon", [sample]) },
        { enabled: true, adapter: {
          name: "supabase",
          search: async () => { throw new Error("offline"); },
        } },
      ],
    );
    expect(result.sources).toEqual({ neon: "ok", supabase: "unavailable" });
    expect(result.providers[0]?.registrationStatus).toBe("not_currently_verified");
    expect(result.providers[0]?.availability).toBe("unknown");
    expect(result.graph.edges).toEqual([
      { sourceId: "source:neon", targetId: "provider:neon:fixture-1", kind: "source_record" },
      { sourceId: "provider:neon:fixture-1", targetId: "state:NSW", kind: "listed_in_state" },
    ]);
  });

  it("rejects invented verification and does not merge independent databases by name", async () => {
    const fakeVerified = { ...sample, registrationStatus: "verified" };
    const parallel = {
      ...sample, id: "fixture-2", source: "supabase" as const,
    };
    const result = await queryPublicDirectory(
      { text: "access", limit: 10 },
      [
        { enabled: true, adapter: adapter("neon", [fakeVerified as PublicDirectoryProvider]) },
        { enabled: true, adapter: adapter("supabase", [parallel]) },
      ],
    );
    expect(result.providers).toHaveLength(1);
    expect(result.providers[0]?.source).toBe("supabase");
    expect(result.providers[0]?.registrationStatus).toBe("not_currently_verified");
  });

  it("builds GraphGL node/edge data for source and region, not people", () => {
    const graph = toDirectoryGraph([sample, { ...sample, id: "fixture-2" }]);
    expect(graph.nodes.filter((x) => x.kind === "source")).toHaveLength(1);
    expect(graph.nodes.filter((x) => x.kind === "provider")).toHaveLength(2);
    expect(graph.nodes.filter((x) => x.kind === "state")).toHaveLength(1);
    expect(graph.nodes.find((x) => x.kind === "state")?.label).toBe("NSW");
  });
});
