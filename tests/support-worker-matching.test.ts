import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workerProfile: { findMany: vi.fn() },
    participantMatchPreferences: { findUnique: vi.fn() },
    accessibilityProfile: { findUnique: vi.fn() },
    availabilityWindow: { findMany: vi.fn() },
    workerMatchAvailabilityWindow: { findFirst: vi.fn() },
    serviceSite: { findFirst: vi.fn() },
    careShift: { count: vi.fn() },
    workerMatchEvent: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    matchRun: { create: vi.fn(), update: vi.fn() },
    matchCandidate: { create: vi.fn(), updateMany: vi.fn() },
  },
}));

vi.mock("@/lib/routing/travel-matrix-service", () => ({
  getTravelTimeSeconds: vi.fn().mockResolvedValue({
    durationSeconds: 900,
    distanceMeters: 8000,
    source: "cached",
  }),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

import {
  applyHardFilters,
  buildSafetyBadges,
  sanitizeMatchForParticipant,
} from "@/lib/matching/support-worker-matching";
import type { ParticipantSupportProfile, SupportRequest } from "@/types/support-workers";

const baseProfile: ParticipantSupportProfile = {
  participantId: "p1",
  preferredWorkerIds: [],
  blockedWorkerIds: ["w-blocked"],
  hiddenWorkerIds: [],
  preferredGender: null,
  preferredLanguages: [],
  preferredCommunicationModes: [],
  maxDistanceKm: 40,
  continuityPreferred: true,
  requiresBehaviourSupportPlan: false,
  communicationPreferences: [],
};

const baseRequest: SupportRequest = {
  supportType: "community_access",
  startsAt: "2026-06-10T01:00:00.000Z",
  endsAt: "2026-06-10T05:00:00.000Z",
};

const workerVerified = {
  id: "w1",
  displayName: "Alex",
  profileSummary: null,
  organisationId: "o1",
  organisationName: "Care Co",
  serviceTypes: ["community_access"],
  serviceRegions: ["Sydney"],
  languages: ["English"],
  communicationCapabilities: [],
  qualificationsSummary: "Cert III",
  verificationStatus: "verified" as const,
  workerScreeningStatus: "verified" as const,
  wwccStatus: "verified" as const,
  firstAidStatus: "verified" as const,
  capabilities: ["manual_handling"],
  behaviourSupportPlanTrained: true,
  gender: null,
  maxTravelRadiusKm: 50,
  communicationModes: ["plain_english"],
  reliabilityScore: 0.9,
  cancellationRate: 0.05,
  hasUnresolvedIncident: false,
};

describe("applyHardFilters", () => {
  it("excludes blocked workers", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.availabilityWindow.findMany).mockResolvedValue([
      {
        dayOfWeek: "WEDNESDAY",
        startTime: "00:00",
        endTime: "23:59",
      },
    ] as never);
    vi.mocked(prisma.workerMatchAvailabilityWindow.findFirst).mockResolvedValue({
      id: "win1",
    } as never);
    vi.mocked(prisma.serviceSite.findFirst).mockResolvedValue({
      lat: -33.87,
      lng: 151.21,
    } as never);

    const blocked = { ...workerVerified, id: "w-blocked" };
    const { passed, excluded } = await applyHardFilters(
      [blocked, workerVerified],
      baseRequest,
      baseProfile
    );
    expect(excluded.some((e) => e.code === "PARTICIPANT_BLOCKED")).toBe(true);
    expect(passed.some((w) => w.id === "w-blocked")).toBe(false);
  });
});

describe("buildSafetyBadges", () => {
  it("uses text labels not colour alone", () => {
    const badges = buildSafetyBadges(workerVerified);
    expect(badges.every((b) => b.label.length > 0)).toBe(true);
    expect(badges.find((b) => b.code === "verification")?.label).toContain(
      "Verified"
    );
  });
});

describe("sanitizeMatchForParticipant", () => {
  it("omits internal fields from payload", () => {
    const safe = sanitizeMatchForParticipant({
      worker: {
        ...workerVerified,
        badges: buildSafetyBadges(workerVerified),
      },
      score: 80,
      confidence: "high",
      reasons: [
        {
          code: "QUALIFICATION_FIT",
          label: "Qualifications",
          plainLanguageExplanation: "Checks passed.",
        },
      ],
      warnings: [],
      rank: 1,
    });
    const json = JSON.stringify(safe);
    expect(json).not.toContain("participantNotes");
    expect(json).not.toContain("homeSuburb");
    expect(safe.worker.displayName).toBe("Alex");
  });
});
