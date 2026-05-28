import { describe, expect, it, vi, beforeEach } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { parseShiftQuery } from "@/lib/care/shift-creator/parse-shift-query";
import { runShiftCreatorStream } from "@/lib/care/shift-creator/shift-creator-stream-service";

const actor: CurrentUser = {
  id: "provider-user-1",
  email: "provider@test.com",
  name: "Provider Admin",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "provider_admin",
  roles: ["provider_admin"],
};

const mockBooking = {
  id: "seed-care-booking-mvp",
  careRequestId: "seed-care-req-3",
  organisationId: "org-care-1",
  title: "Medical appointment",
  status: "pending_provider",
  scheduledStartAt: new Date("2026-06-01T09:00:00.000Z"),
  scheduledEndAt: new Date("2026-06-01T11:00:00.000Z"),
  location: "Demo Medical Centre",
  tasks: [{ name: "Appointment escort", intensity: "standard" }],
  score: 100,
};

const mockWorkers = [
  { id: "wp-demo-1", displayName: "Demo Worker One" },
  { id: "wp-demo-2", displayName: "Demo Worker Two" },
];

vi.mock("@/lib/care/shift-creator/resolve-booking", () => ({
  resolveCareBooking: vi.fn(async () => ({
    booking: mockBooking,
    ambiguous: [],
    warnings: [],
  })),
}));

vi.mock("@/lib/care/shift-creator/resolve-worker", () => ({
  listOrgWorkers: vi.fn(async () => mockWorkers),
  resolveWorkerFromParse: vi.fn(() => ({
    workerProfileId: "wp-demo-1",
    workerDisplayName: "Demo Worker One",
    warnings: [],
  })),
}));

vi.mock("@/lib/care/worker-eligibility", () => ({
  loadWorkerForEligibility: vi.fn(async () => ({
    id: "wp-demo-1",
    organisationId: "org-care-1",
    active: true,
    verificationStatus: "verified",
    workerScreeningStatus: "verified",
    highIntensityCompetencyVerified: true,
  })),
  assertWorkerEligibleForBooking: vi.fn(),
}));

describe("parseShiftQuery", () => {
  it("matches worker display name in query", () => {
    const parsed = parseShiftQuery(
      "Assign Demo Worker One Tuesday 9am to 1pm",
      mockWorkers,
    );
    expect(parsed.workerProfileId).toBe("wp-demo-1");
  });
});

describe("runShiftCreatorStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits stages in order and returns draft result", async () => {
    const stages: string[] = [];

    const result = await runShiftCreatorStream({
      query: "Schedule Demo Worker One for medical appointment Tuesday 9am",
      careBookingId: "seed-care-booking-mvp",
      actorUser: actor,
      onEvent: async (event) => {
        stages.push(event.stage);
      },
    });

    expect(stages[0]).toBe("received_query");
    expect(stages).toContain("resolved_booking");
    expect(stages).toContain("checked_eligibility");
    expect(stages).toContain("finalized");
    expect(result.draft.careBookingId).toBe("seed-care-booking-mvp");
    expect(result.draft.eligibility.ok).toBe(true);
    expect(result.draft.workerProfileId).toBe("wp-demo-1");
  });
});
