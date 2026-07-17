import { describe, expect, it, vi, beforeEach } from "vitest";

const store = {
  events: new Map<string, any>(),
  signals: [] as any[],
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lifeEvent: {
      create: vi.fn(async (args: any) => {
        const ev = { id: `ev-${store.events.size + 1}`, status: "draft", ...args.data };
        store.events.set(ev.id, ev);
        return ev;
      }),
      findUnique: vi.fn(async (args: any) => store.events.get(args.where.id) ?? null),
      update: vi.fn(async (args: any) => {
        const cur = store.events.get(args.where.id) ?? {};
        const updated = { ...cur, ...args.data };
        store.events.set(args.where.id, updated);
        return updated;
      }),
      findMany: vi.fn(async () => Array.from(store.events.values())),
    },
    continuitySignal: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async (args: any) => {
        store.signals.push(args.data);
        return { id: `sig-${store.signals.length}`, ...args.data };
      }),
    },
  },
}));

import {
  assertNotAutoLifeEventFromHistory,
  cancelLifeEvent,
  confirmLifeEvent,
  declareLifeEvent,
} from "@/lib/life-events/life-event-service";

beforeEach(() => {
  store.events.clear();
  store.signals.length = 0;
});

describe("life event service", () => {
  it("declares an event with status=draft", async () => {
    const ev = await declareLifeEvent({
      participantId: "p-1",
      kind: "address_change",
      source: "participant_self",
      declaredById: "u-1",
      title: "New address",
    });
    expect(ev.status).toBe("draft");
    expect(ev.autoCreated).toBe(false);
  });

  it("confirming a life event moves to confirmed and records a signal", async () => {
    const ev = await declareLifeEvent({
      participantId: "p-1",
      kind: "address_change",
      source: "participant_self",
      declaredById: "u-1",
      title: "New address",
    });
    const out = await confirmLifeEvent({ lifeEventId: ev.id, confirmedById: "u-2" });
    expect(out.event.status).toBe("confirmed");
    expect(out.signal.kind).toBe("life_event_declared");
    expect(store.signals.length).toBe(1);
  });

  it("confirming with activate=true moves to active", async () => {
    const ev = await declareLifeEvent({
      participantId: "p-1",
      kind: "travel_planned",
      source: "delegate",
      declaredById: "u-1",
      title: "Trip",
    });
    const out = await confirmLifeEvent({
      lifeEventId: ev.id,
      confirmedById: "u-2",
      activate: true,
    });
    expect(out.event.status).toBe("active");
  });

  it("cannot confirm an event twice", async () => {
    const ev = await declareLifeEvent({
      participantId: "p-1",
      kind: "hospital_admission",
      source: "coordinator",
      declaredById: "u-1",
      title: "Hospital",
    });
    await confirmLifeEvent({ lifeEventId: ev.id, confirmedById: "u-2" });
    await expect(
      confirmLifeEvent({ lifeEventId: ev.id, confirmedById: "u-2" })
    ).rejects.toThrow(/ALREADY/);
  });

  it("cancelLifeEvent moves status to cancelled", async () => {
    const ev = await declareLifeEvent({
      participantId: "p-1",
      kind: "other",
      source: "participant_self",
      declaredById: "u-1",
      title: "Placeholder",
    });
    const cancelled = await cancelLifeEvent({ lifeEventId: ev.id, cancelledById: "u-1" });
    expect(cancelled.status).toBe("cancelled");
  });

  it("aura_suggestion source requires aiSuggested=true", async () => {
    await expect(
      declareLifeEvent({
        participantId: "p-1",
        kind: "other",
        source: "aura_suggestion",
        declaredById: "u-1",
        title: "AURA-suggested",
        aiSuggested: false,
      })
    ).rejects.toThrow(/AURA_MUST_SET_AI_SUGGESTED/);
  });

  it("assertNotAutoLifeEventFromHistory refuses non-human sources", () => {
    expect(() => assertNotAutoLifeEventFromHistory("participant_self")).not.toThrow();
    expect(() => assertNotAutoLifeEventFromHistory("aura_suggestion")).not.toThrow();
    expect(() => assertNotAutoLifeEventFromHistory("operational_signal")).toThrow(
      /AUTO_FROM_HISTORY_PROHIBITED/
    );
    expect(() => assertNotAutoLifeEventFromHistory("civic_feed")).toThrow();
  });

  it("declared event carries autoCreated=false regardless of source", async () => {
    const ev = await declareLifeEvent({
      participantId: "p-1",
      kind: "disaster_impact",
      source: "provider",
      declaredById: "u-1",
      title: "Flood",
    });
    expect(ev.autoCreated).toBe(false);
  });
});
