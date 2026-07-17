import { describe, expect, it, vi, beforeEach } from "vitest";

type Edge = { fromNodeId: string; toNodeId: string; kind: string };

const edges: Edge[] = [];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    continuityNodeReference: {
      upsert: vi.fn(async (args: any) => ({ id: args.create?.referenceKey ?? "n", ...args.create })),
      findMany: vi.fn(async () => []),
    },
    continuityDependency: {
      upsert: vi.fn(async (args: any) => {
        const create = args.create;
        edges.push({ fromNodeId: create.fromNodeId, toNodeId: create.toNodeId, kind: create.kind });
        return { id: `${create.fromNodeId}->${create.toNodeId}`, ...create };
      }),
      findMany: vi.fn(async (args: any) => {
        const from: string[] = args.where?.fromNodeId?.in ?? [];
        return edges.filter((e) => from.includes(e.fromNodeId));
      }),
    },
  },
}));

import { createsCycle, upsertContinuityDependency } from "@/lib/continuity/graph/graph-service";

beforeEach(() => {
  edges.length = 0;
});

describe("continuity graph cycle detection", () => {
  it("self-loop is refused", async () => {
    await expect(
      upsertContinuityDependency({ fromNodeId: "a", toNodeId: "a", kind: "supports", provenance: "test" })
    ).rejects.toThrow(/GRAPH_SELF_LOOP/);
  });

  it("cycle detection catches a->b->c->a", async () => {
    edges.push({ fromNodeId: "b", toNodeId: "c", kind: "supports" });
    edges.push({ fromNodeId: "c", toNodeId: "a", kind: "supports" });
    // proposing a->b would create a cycle
    const cycles = await createsCycle("a", "b");
    expect(cycles).toBe(true);
  });

  it("linear graph a->b->c does not cycle", async () => {
    edges.push({ fromNodeId: "b", toNodeId: "c", kind: "supports" });
    const cycles = await createsCycle("a", "b");
    expect(cycles).toBe(false);
  });

  it("upsertContinuityDependency refuses cycle-creating edge", async () => {
    edges.push({ fromNodeId: "b", toNodeId: "a", kind: "supports" });
    await expect(
      upsertContinuityDependency({ fromNodeId: "a", toNodeId: "b", kind: "supports", provenance: "test" })
    ).rejects.toThrow(/GRAPH_CYCLE_DETECTED/);
  });
});
