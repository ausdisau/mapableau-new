import { describe, expect, it, vi, beforeEach } from "vitest";

const store = {
  cases: new Map<string, any>(),
  impacts: [] as any[],
  edges: [] as Array<{ fromNodeId: string; toNodeId: string }>,
  nodes: new Map<string, any>(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    continuityCase: {
      findUnique: vi.fn(async (args: any) => store.cases.get(args.where.id) ?? null),
    },
    continuityImpactAssessment: {
      create: vi.fn(async (args: any) => {
        store.impacts.push(args.data);
        return { id: `imp-${store.impacts.length}`, ...args.data };
      }),
      update: vi.fn(async (args: any) => ({ id: args.where.id, ...args.data })),
    },
    continuityDependency: {
      findMany: vi.fn(async (args: any) => {
        const from: string[] = args.where?.fromNodeId?.in ?? [];
        return store.edges.filter((e) => from.includes(e.fromNodeId)).map((e) => ({ toNodeId: e.toNodeId }));
      }),
    },
    continuityNodeReference: {
      findMany: vi.fn(async (args: any) => {
        const ids: string[] = args.where?.id?.in ?? [];
        return ids.map((id) => store.nodes.get(id)).filter(Boolean);
      }),
    },
  },
}));

import { computeAndStoreImpact } from "@/lib/continuity/impact/impact-service";

beforeEach(() => {
  store.cases.clear();
  store.impacts.length = 0;
  store.edges.length = 0;
  store.nodes.clear();
});

describe("impact service", () => {
  it("returns 'none' when starting node has no downstream", async () => {
    store.cases.set("c-1", { id: "c-1", participantId: "p-1", organisationId: "org-1", originatingSignals: [], impact: null });
    store.nodes.set("n-1", { id: "n-1", kind: "care_request", referenceKey: "cr-1" });
    const r = await computeAndStoreImpact({ caseId: "c-1", startingNodeId: "n-1" });
    expect(r.level).toBe("none");
  });

  it("scales impact level with number of affected nodes", async () => {
    store.cases.set("c-2", { id: "c-2", participantId: "p-1", organisationId: "org-1", originatingSignals: [], impact: null });
    // Fan-out from a to 12 downstream nodes to reach 'critical'.
    for (let i = 0; i < 12; i++) {
      store.edges.push({ fromNodeId: "n-root", toNodeId: `n-${i}` });
      store.nodes.set(`n-${i}`, { id: `n-${i}`, kind: "care_shift", referenceKey: `s-${i}` });
    }
    store.nodes.set("n-root", { id: "n-root", kind: "care_request", referenceKey: "cr-root" });
    const r = await computeAndStoreImpact({ caseId: "c-2", startingNodeId: "n-root" });
    expect(r.level).toBe("critical");
  });

  it("does not perform any writes on prisma.continuityDependency", async () => {
    // Just confirms no mutation happened on edges/nodes.
    store.cases.set("c-3", { id: "c-3", participantId: "p-1", organisationId: null, originatingSignals: [], impact: null });
    store.nodes.set("n-x", { id: "n-x", kind: "care_request", referenceKey: "x" });
    await computeAndStoreImpact({ caseId: "c-3", startingNodeId: "n-x" });
    // No side-effects on graph.
    expect(store.edges.length).toBe(0);
  });
});
