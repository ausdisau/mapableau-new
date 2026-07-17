import { describe, expect, it, vi, beforeEach } from "vitest";

const state = {
  careRequestFinding: null as any,
  eventFinding: null as any,
  createdBookings: [] as any[],
  createdEvents: [] as any[],
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    careRequest: {
      findUnique: vi.fn(async () => state.careRequestFinding),
    },
    orchestrationEvent: {
      findUnique: vi.fn(async () => state.eventFinding),
      findFirst: vi.fn(async () => state.eventFinding),
      create: vi.fn(async (args: any) => {
        state.createdEvents.push(args.data);
        return args.data;
      }),
      upsert: vi.fn(),
    },
    transportBooking: {
      findUnique: vi.fn(async () => null),
    },
    careShift: { findUnique: vi.fn() },
    orchestrationRescheduleRequest: { findMany: vi.fn(async () => []) },
  },
}));

vi.mock("@/lib/config/y2-orchestration", () => ({
  CARE_TRANSPORT_PICKUP_BUFFER_MINUTES: 30,
  y2OrchestrationConfig: { careTransportOrchestrationV2Enabled: true },
}));
vi.mock("@/lib/config/phase3", () => ({
  phase3Config: { orchestrationEnabled: true },
}));
vi.mock("@/lib/consent/micro-consent-service", () => ({ requireMicroConsent: vi.fn() }));
vi.mock("@/lib/transport/transport-booking-service", () => ({
  createTransportBooking: vi.fn(async (input: any) => {
    state.createdBookings.push(input);
    return { id: "tb-created", ...input };
  }),
}));
vi.mock("@/lib/continuity/signals/signal-service", () => ({ recordContinuitySignal: vi.fn() }));
vi.mock("@/lib/continuity/cases/case-service", () => ({ openOrExtendContinuityCase: vi.fn() }));

import {
  createLinkedTransportFromCareRequest,
  OrchestrationInvalidError,
} from "@/lib/orchestration/care-transport-orchestrator";

beforeEach(() => {
  state.createdBookings.length = 0;
  state.createdEvents.length = 0;
  state.eventFinding = null;
});

describe("executable booking guards", () => {
  it("refuses when preferredDate is missing", async () => {
    state.careRequestFinding = {
      id: "cr-1",
      participantId: "p-1",
      linkedTransportRequired: true,
      preferredDate: null,
      address: "12 Wattle St",
      shareAccessibility: false,
      participant: { participantProfile: { homeSuburb: "Redfern" } },
    };
    await expect(
      createLinkedTransportFromCareRequest("cr-1", "u-1")
    ).rejects.toBeInstanceOf(OrchestrationInvalidError);
    expect(state.createdBookings.length).toBe(0);
  });

  it("refuses when address is a placeholder", async () => {
    state.careRequestFinding = {
      id: "cr-2",
      participantId: "p-1",
      linkedTransportRequired: true,
      preferredDate: new Date("2026-07-01T09:00:00Z"),
      address: "Address to be confirmed",
      shareAccessibility: false,
      participant: { participantProfile: null },
    };
    await expect(
      createLinkedTransportFromCareRequest("cr-2", "u-1")
    ).rejects.toMatchObject({ code: "PLACEHOLDER_ADDRESS" });
    expect(state.createdBookings.length).toBe(0);
  });

  it("creates a draft booking when data is real", async () => {
    state.careRequestFinding = {
      id: "cr-3",
      participantId: "p-1",
      linkedTransportRequired: true,
      preferredDate: new Date("2026-07-01T09:00:00Z"),
      address: "12 Wattle St, Redfern NSW",
      shareAccessibility: true,
      participant: { participantProfile: { homeSuburb: "12 Wattle St, Redfern NSW" } },
    };
    const r = await createLinkedTransportFromCareRequest("cr-3", "u-1");
    expect(state.createdBookings.length).toBe(1);
    expect(state.createdBookings[0].status).toBe("draft");
    expect(r).toMatchObject({ transportBooking: expect.any(Object) });
  });

  it("refuses when the care request does not request linked transport", async () => {
    state.careRequestFinding = {
      id: "cr-4",
      participantId: "p-1",
      linkedTransportRequired: false,
      preferredDate: new Date(),
      address: "somewhere real",
      participant: { participantProfile: null },
    };
    await expect(
      createLinkedTransportFromCareRequest("cr-4", "u-1")
    ).rejects.toMatchObject({ code: "LINK_NOT_REQUESTED" });
  });
});
