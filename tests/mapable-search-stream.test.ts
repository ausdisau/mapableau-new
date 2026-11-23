import { describe, expect, it } from "vitest";

import {
  formatPublicSearchStreamEvent,
  initialPublicStreamView,
  publicStreamRequestSchema,
  readPublicSearchStreamChunk,
  reducePublicStreamView,
  type PublicSearchStreamEvent,
} from "@/lib/search/mapable-stream-contract";

const sample = {
  id: "synthetic-providers",
  kind: "module" as const,
  vertical: "providers" as const,
  title: "Provider Finder",
  description: "Public provider discovery",
  href: "/provider-finder",
  provenance: "mapable_navigation" as const,
  sourceLabel: "MapAble navigation",
  registration: "not_independently_verified" as const,
  workerScreening: "not_independently_verified" as const,
  accessFit: "unknown" as const,
  availability: "unknown" as const,
};

describe("MapAble streaming request boundaries", () => {
  it("requires explicit public-server approval, limits text and rejects private fields", () => {
    expect(publicStreamRequestSchema.safeParse({
      message: "Accessible transport", vertical: "transport", publicSearchApproved: true,
    }).success).toBe(true);
    expect(publicStreamRequestSchema.safeParse({
      message: "Accessible transport", vertical: "transport", publicSearchApproved: false,
    }).success).toBe(false);
    expect(publicStreamRequestSchema.safeParse({
      message: "Find care", vertical: "care", publicSearchApproved: true, participantId: "secret",
    }).success).toBe(false);
    expect(publicStreamRequestSchema.safeParse({
      message: "x".repeat(181), vertical: "all", publicSearchApproved: true,
    }).success).toBe(false);
  });

  it("parses SSE messages across arbitrary network chunk boundaries", () => {
    const event: PublicSearchStreamEvent = {
      type: "message.delta", text: "No worker screening has been verified.",
    };
    const encoded = formatPublicSearchStreamEvent(event);
    const first = readPublicSearchStreamChunk(encoded.slice(0, 17));
    expect(first.events).toHaveLength(0);
    const second = readPublicSearchStreamChunk(first.remainder + encoded.slice(17));
    expect(second.events).toEqual([event]);
    expect(second.remainder).toBe("");
  });

  it("refuses non-allowlisted events, fake verified clearance and malformed JSON", () => {
    const text = [
      'data: {"type":"tool.execute","action":"payment"}',
      'data: {"type":"result.upsert","result":{"registration":"verified"}}',
      'data: not json',
      "",
      "",
    ].join("\n");
    expect(readPublicSearchStreamChunk(text).events).toEqual([]);
  });

  it("deduplicates sourced results and retains unknown registration", () => {
    let state = reducePublicStreamView(initialPublicStreamView(), {
      type: "search.started", requestId: "00000000-0000-4000-8000-000000000001",
    });
    state = reducePublicStreamView(state, { type: "source.found", label: "MapAble navigation" });
    state = reducePublicStreamView(state, { type: "source.found", label: "MapAble navigation" });
    state = reducePublicStreamView(state, { type: "result.upsert", result: sample });
    state = reducePublicStreamView(state, { type: "result.upsert", result: sample });
    state = reducePublicStreamView(state, { type: "message.delta", text: "No evidence yet. " });
    state = reducePublicStreamView(state, {
      type: "spatial.updated", available: false, explanation: "No sourced geometry.",
    });
    state = reducePublicStreamView(state, {
      type: "search.completed", resultCount: 1, sourceState: "navigation_only", warnings: [],
    });
    expect(state.results).toHaveLength(1);
    expect(state.sources).toEqual(["MapAble navigation"]);
    expect(state.answer).toBe("No evidence yet. ");
    expect(state.spatialNote).toBe("No sourced geometry.");
    expect(state.status).toBe("completed");
    expect(state.results[0]?.registration).toBe("not_independently_verified");
  });
});
