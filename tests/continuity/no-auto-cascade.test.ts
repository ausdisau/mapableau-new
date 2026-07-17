import { describe, expect, it, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

const state = {
  shift: {
    id: "shift-1",
    participantId: "p-1",
    organisationId: "org-1",
    careRequestId: "cr-1",
    careRequest: { participantId: "p-1" },
  },
  event: { transportBookingId: "tb-1", careRequestId: "cr-1" },
  orchestrationEvents: [] as any[],
  transportUpdated: false,
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    careShift: {
      findUnique: vi.fn(async () => state.shift),
    },
    orchestrationEvent: {
      findFirst: vi.fn(async () => state.event),
      upsert: vi.fn(async (args: any) => {
        state.orchestrationEvents.push(args.create);
        return args.create;
      }),
      findUnique: vi.fn(async () => null),
      create: vi.fn(async () => null),
    },
    transportBooking: {
      update: vi.fn(async () => {
        state.transportUpdated = true;
        return {};
      }),
      findUnique: vi.fn(async () => null),
    },
    orchestrationRescheduleRequest: {
      findMany: vi.fn(async () => []),
      create: vi.fn(async () => null),
    },
    careRequest: { findUnique: vi.fn() },
  },
}));

const recordedSignals: any[] = [];
const openedCases: any[] = [];

vi.mock("@/lib/continuity/signals/signal-service", () => ({
  recordContinuitySignal: vi.fn(async (input: any) => {
    recordedSignals.push(input);
    return { id: `sig-${recordedSignals.length}`, ...input };
  }),
}));

vi.mock("@/lib/continuity/cases/case-service", () => ({
  openOrExtendContinuityCase: vi.fn(async (input: any) => {
    openedCases.push(input);
    return { id: `case-${openedCases.length}`, ...input };
  }),
}));

vi.mock("@/lib/config/y2-orchestration", async () => ({
  CARE_TRANSPORT_PICKUP_BUFFER_MINUTES: 30,
  y2OrchestrationConfig: { careTransportOrchestrationV2Enabled: true },
}));
vi.mock("@/lib/config/phase3", async () => ({
  phase3Config: { orchestrationEnabled: true },
}));
vi.mock("@/lib/consent/micro-consent-service", () => ({ requireMicroConsent: vi.fn() }));
vi.mock("@/lib/transport/transport-booking-service", () => ({ createTransportBooking: vi.fn() }));

import { propagateCareShiftStatusToTransport } from "@/lib/orchestration/care-transport-orchestrator";

beforeEach(() => {
  state.transportUpdated = false;
  state.orchestrationEvents.length = 0;
  recordedSignals.length = 0;
  openedCases.length = 0;
});

describe("Wave 11 — care cancellation never auto-cancels transport", () => {
  it("care cancel produces a signal and opens a case, but does NOT mutate transport", async () => {
    const r = await propagateCareShiftStatusToTransport({
      careShiftId: "shift-1",
      newStatus: "cancelled",
      actorUserId: "u-1",
    });
    expect(state.transportUpdated).toBe(false);
    expect(recordedSignals.length).toBe(1);
    expect(recordedSignals[0].kind).toBe("care_shift_cancelled");
    expect(openedCases.length).toBe(1);
    expect(openedCases[0].category).toBe("transport");
    expect(r).toMatchObject({
      propagated: false,
      signalRecorded: true,
      reason: "wave11_no_auto_cancel",
    });
  });

  it("returns skipped when status is not cancelled", async () => {
    const r = await propagateCareShiftStatusToTransport({
      careShiftId: "shift-1",
      newStatus: "in_progress",
      actorUserId: "u-1",
    });
    expect(r).toMatchObject({ skipped: true });
  });

  it("orchestrator source file no longer performs transportBooking.update on cancel", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "lib/orchestration/care-transport-orchestrator.ts"),
      "utf8"
    );
    // A cancel-branch that also calls transportBooking.update would be a
    // regression.
    expect(src).not.toMatch(/if \(params\.newStatus === ['"]cancelled['"]\)[\s\S]{0,300}prisma\.transportBooking\.update/);
  });

  it("dedupe key does not include Date.now()", async () => {
    await propagateCareShiftStatusToTransport({
      careShiftId: "shift-1",
      newStatus: "cancelled",
      actorUserId: "u-1",
    });
    expect(recordedSignals[0].dedupeKey).toBe("care-cancel-signal-shift-1-tb-1");
    expect(recordedSignals[0].dedupeKey).not.toMatch(/\d{10,}/);
  });
});
