/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { evaluateRouteConstraints } from "@/lib/transport/maji/constraint-filter";
import { liveTrafficUsedForAdvice } from "@/lib/transport/maji/live-label";
import { estimateRemainingOperatingCost } from "@/lib/transport/maji/operating-cost-engine";
import { rankRouteCandidates } from "@/lib/transport/maji/ranker";
import { mapTomTomRouteResponses } from "@/lib/transport/routing/tomtom-orbis-routing-adapter";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type { TrafficAwareRouteCandidate } from "@/types/maji";

const origin = { lat: -33.8688, lng: 151.2093 };
const destination = { lat: -33.88, lng: 151.22 };

const participant: CurrentUser = {
  id: "participant-1",
  email: "p@test.com",
  name: "Participant",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

function candidate(
  overrides: Partial<TrafficAwareRouteCandidate> &
    Pick<TrafficAwareRouteCandidate, "id" | "role" | "label">
): TrafficAwareRouteCandidate {
  const { cost, constraints, ...rest } = overrides;
  return {
    remainingDurationSeconds: 2400,
    remainingDistanceMetres: 10_000,
    estimatedArrivalAt: "2026-06-01T10:00:00.000Z",
    liveTrafficUsed: false,
    source: "mock",
    trafficModeApplied: "none",
    providerStatus: "ok",
    validUntil: "2026-06-01T10:15:00.000Z",
    timeSavingSeconds: null,
    includeReasons: [],
    excludeReasons: [],
    hazardEvidence: [],
    ...rest,
    cost: {
      paidDriverTimeCents: 2000,
      distanceCostCents: 1000,
      energyAllowanceCents: null,
      extraChargesCents: null,
      tollCents: 0,
      totalRemainingCents: 3000,
      operatingCostDifferenceCents: 0,
      tollLineStatus: "estimated",
      ...cost,
    },
    constraints: {
      passed: true,
      status: null,
      reasons: [],
      accessibilityPassed: true,
      arrivalCommitmentPassed: true,
      closedRoadMatched: false,
      requiresHumanReview: false,
      ...constraints,
    },
  };
}

const thresholds = { minTimeSavingSeconds: 180, minCostSavingCents: 200 };

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transportTrip: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    transportJourneyAdvice: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transportQuote: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    transportDispatchAssignment: { findFirst: vi.fn() },
    transportTripEvent: { create: vi.fn() },
    organisationMember: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/transport/maji/candidate-generator", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/transport/maji/candidate-generator")
  >("@/lib/transport/maji/candidate-generator");
  return {
    ...actual,
    generateRouteVariants: vi.fn(),
  };
});

vi.mock("@/lib/transport/maji/origin", () => ({
  resolveJourneyOrigin: vi.fn(),
}));

vi.mock("@/lib/tfnsw/traffic-advisory-service", () => ({
  buildTrafficAdvisoryForRoute: vi.fn().mockResolvedValue(null),
  permittedHazardEvidence: vi.fn().mockReturnValue({
    source: "tfnsw_live_traffic",
    fetchedAt: "2026-06-01T09:00:00.000Z",
    hazards: [],
  }),
}));

vi.mock("@/lib/tfnsw/toll-calculator-adapter", () => ({
  estimateTollsForGeometry: vi.fn().mockResolvedValue({
    tollCents: null,
    status: "insufficient_price_information",
  }),
}));

vi.mock("@/lib/transport/quotes/quote-service", () => ({
  getAcceptedQuoteTotalCentsForTripRequest: vi.fn().mockResolvedValue(12500),
}));

vi.mock("@/lib/transport/transport-access-policy", () => ({
  assertCanAccessTrip: vi.fn().mockResolvedValue("exact"),
  getActiveAssignment: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/transport/transport-eligibility-service", () => ({
  checkVehicleEligibility: vi.fn(),
}));

vi.mock("@/lib/transport/transport-event-service", () => ({
  recordTripEvent: vi.fn().mockResolvedValue({ id: "evt-1" }),
}));

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: vi.fn(),
}));

import { MajiJourneyIntelligencePanel } from "@/components/transport/MajiJourneyIntelligencePanel";
import { requireApiSession } from "@/lib/api/auth-handler";
import { prisma } from "@/lib/prisma";
import { generateRouteVariants } from "@/lib/transport/maji/candidate-generator";
import { resolveJourneyOrigin } from "@/lib/transport/maji/origin";
import { getAcceptedQuoteTotalCentsForTripRequest } from "@/lib/transport/quotes/quote-service";
import { assertCanAccessTrip } from "@/lib/transport/transport-access-policy";
import { recordTripEvent } from "@/lib/transport/transport-event-service";

const tripRow = {
  id: "trip-1",
  tripRequestId: "req-1",
  participantId: "participant-1",
  providerOrganisationId: "org-1",
  status: "en_route_to_dropoff",
  pickupLat: origin.lat,
  pickupLng: origin.lng,
  dropoffLat: destination.lat,
  dropoffLng: destination.lng,
  scheduledStart: new Date("2026-06-01T09:00:00.000Z"),
  scheduledEnd: new Date("2026-06-01T12:00:00.000Z"),
  mobilityRequirements: {},
  stops: [],
};

function variant(key: string, duration: number, distance: number) {
  return {
    key,
    label: key,
    role: key === "current" ? ("current" as const) : ("alternative" as const),
    estimate: {
      distanceMetres: distance,
      durationSeconds: duration,
      travelDurationSeconds: duration,
      liveTrafficUsed: false,
      source: "mock" as const,
      trafficMode: "none",
      providerStatus: "ok",
      generatedAt: new Date("2026-06-01T09:00:00.000Z"),
      validUntil: new Date("2026-06-01T09:20:00.000Z"),
      geometry: [origin, destination],
      fromCache: false,
    },
  };
}

describe("MAJI operating cost and ranking", () => {
  it("recommends a faster remaining alternative under congestion", () => {
    const current = candidate({
      id: "current",
      role: "current",
      label: "Current",
      remainingDurationSeconds: 2400,
    });
    const alt = candidate({
      id: "alt",
      role: "alternative",
      label: "Faster",
      remainingDurationSeconds: 1500,
      cost: { ...current.cost, totalRemainingCents: 2800 },
    });
    const ranked = rankRouteCandidates({
      preference: "earliest_arrival",
      current,
      alternatives: [alt],
      thresholds,
    });
    expect(ranked.status).toBe("recommended");
    expect(ranked.recommended?.id).toBe("alt");
  });

  it("does not pick a faster toll road when operating cost rises under lowest_cost", () => {
    const current = candidate({
      id: "current",
      role: "current",
      label: "Current",
      remainingDurationSeconds: 2400,
      cost: { totalRemainingCents: 3000 } as TrafficAwareRouteCandidate["cost"],
    });
    const alt = candidate({
      id: "toll",
      role: "alternative",
      label: "Toll road",
      remainingDurationSeconds: 1200,
      cost: {
        totalRemainingCents: 5200,
        tollCents: 2200,
        operatingCostDifferenceCents: 2200,
      } as TrafficAwareRouteCandidate["cost"],
    });
    const ranked = rankRouteCandidates({
      preference: "lowest_cost",
      current,
      alternatives: [alt],
      thresholds,
    });
    expect(ranked.recommended).toBeNull();
    expect(ranked.status).toMatch(/no_alternative|constraint_violation/);
  });

  it("excludes a cheaper route that misses the arrival commitment", () => {
    const result = evaluateRouteConstraints({
      mobility: {},
      vehicleAssigned: true,
      vehicleEligibility: { eligible: true, reasons: [] },
      hazards: [],
      estimatedArrivalAt: new Date("2026-06-01T13:00:00.000Z"),
      commitmentAt: new Date("2026-06-01T12:00:00.000Z"),
    });
    expect(result.passed).toBe(false);
    expect(result.status).toBe("constraint_violation");
    const current = candidate({
      id: "current",
      role: "current",
      label: "Current",
    });
    const alt = candidate({
      id: "late",
      role: "alternative",
      label: "Cheaper late",
      remainingDurationSeconds: 900,
      constraints: result,
      cost: { totalRemainingCents: 1000 } as TrafficAwareRouteCandidate["cost"],
    });
    const ranked = rankRouteCandidates({
      preference: "lowest_cost",
      current,
      alternatives: [alt],
      thresholds,
    });
    expect(ranked.recommended).toBeNull();
    expect(ranked.alternatives[0]?.excludeReasons.join(" ")).toMatch(/excluded/i);
  });

  it("hard-fails accessibility when the vehicle is not eligible", () => {
    const result = evaluateRouteConstraints({
      mobility: { requiresWheelchairAccessible: true },
      vehicleAssigned: true,
      vehicleEligibility: {
        eligible: false,
        reasons: ["Vehicle is not wheelchair accessible"],
      },
      hazards: [],
      estimatedArrivalAt: new Date("2026-06-01T10:00:00.000Z"),
      commitmentAt: new Date("2026-06-01T12:00:00.000Z"),
    });
    expect(result.passed).toBe(false);
    expect(result.accessibilityPassed).toBe(false);
    expect(result.status).toBe("constraint_violation");
  });

  it("marks a closed-road match as human review, not auto-reroute", () => {
    const result = evaluateRouteConstraints({
      mobility: {},
      vehicleAssigned: true,
      vehicleEligibility: { eligible: true, reasons: [] },
      hazards: [{ headline: "Road closed", subCategory: "ROAD CLOSED" }],
      estimatedArrivalAt: new Date("2026-06-01T10:00:00.000Z"),
      commitmentAt: new Date("2026-06-01T12:00:00.000Z"),
    });
    expect(result.passed).toBe(false);
    expect(result.closedRoadMatched).toBe(true);
    expect(result.requiresHumanReview).toBe(true);
    expect(result.status).toBe("human_review_required");
  });

  it("reports source_unavailable when no current remaining route exists", () => {
    const ranked = rankRouteCandidates({
      preference: "balanced",
      current: null,
      alternatives: [],
      thresholds,
      sourceUnavailable: true,
    });
    expect(ranked.status).toBe("source_unavailable");
  });

  it("does not treat expired cache as live traffic", () => {
    expect(
      liveTrafficUsedForAdvice({
        liveTrafficUsed: true,
        validUntil: new Date("2026-06-01T09:00:00.000Z"),
        now: new Date("2026-06-01T09:05:00.000Z"),
      })
    ).toBe(false);
    expect(
      liveTrafficUsedForAdvice({
        liveTrafficUsed: true,
        validUntil: new Date("2026-06-01T09:10:00.000Z"),
        now: new Date("2026-06-01T09:05:00.000Z"),
      })
    ).toBe(true);
  });

  it("keeps unknown tolls as null instead of zero", () => {
    const cost = estimateRemainingOperatingCost({
      remainingDurationSeconds: 600,
      remainingDistanceMetres: 5000,
      centsPerKm: 100,
      centsPerPaidMinute: 50,
      tollCents: null,
      tollLineStatus: "insufficient_price_information",
    });
    expect(cost.tollCents).toBeNull();
    expect(cost.totalRemainingCents).toBeNull();
    expect(cost.tollLineStatus).toBe("insufficient_price_information");
  });
});

describe("TomTom Orbis alternative mapping", () => {
  it("maps every documented routes[] entry when alternatives are present", () => {
    const mapped = mapTomTomRouteResponses(
      {
        routes: [
          {
            summary: { lengthInMeters: 1000, travelTimeInSeconds: 120 },
            legs: [{ summary: { lengthInMeters: 1000, travelTimeInSeconds: 120 }, points: [] }],
          },
          {
            summary: { lengthInMeters: 1100, travelTimeInSeconds: 90 },
            legs: [{ summary: { lengthInMeters: 1100, travelTimeInSeconds: 90 }, points: [] }],
          },
        ],
      },
      { origin, destination },
      "historical"
    );
    expect(mapped).toHaveLength(2);
    expect(mapped[0].durationSeconds).toBe(120);
    expect(mapped[1].durationSeconds).toBe(90);
    expect(mapped[0].liveTrafficUsed).toBe(false);
  });
});

describe("MAJI journey advice service", () => {
  beforeEach(() => {
    vi.stubEnv("MAJI_ADVISORY_ENABLED", "true");
    vi.stubEnv("MAJI_SYNTHETIC_PREVIEW_ENABLED", "true");
    vi.stubEnv("MAJI_SYNTHETIC_CENTS_PER_KM", "100");
    vi.stubEnv("MAJI_SYNTHETIC_CENTS_PER_PAID_MINUTE", "50");
    vi.mocked(prisma.transportTrip.findUnique).mockResolvedValue(tripRow as never);
    vi.mocked(prisma.transportJourneyAdvice.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.transportJourneyAdvice.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.transportJourneyAdvice.delete).mockResolvedValue({} as never);
    vi.mocked(resolveJourneyOrigin).mockResolvedValue({
      point: origin,
      kind: "synthetic",
      label: "Synthetic checkpoint",
    });
    vi.mocked(generateRouteVariants).mockResolvedValue({
      variants: [
        variant("current", 2400, 10_000),
        variant("short", 1500, 8_000),
      ],
      sourceUnavailable: false,
      costLimited: false,
    });
    vi.mocked(prisma.transportJourneyAdvice.create).mockResolvedValue({
      id: "advice-1",
      tripId: "trip-1",
      preference: "balanced",
      status: "recommended",
      decision: "pending",
      evaluatedAt: new Date("2026-06-01T09:00:00.000Z"),
      expiresAt: new Date("2026-06-01T09:15:00.000Z"),
      explanation: "ok",
      provenanceJson: {},
      requiresHumanReview: false,
      acceptedQuoteTotalCents: 12500,
      originKind: "synthetic",
      candidates: [],
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("dismisses without changing the trip or quote", async () => {
    const { recordJourneyAdviceDecision } = await import(
      "@/lib/transport/maji/journey-advice-service"
    );
    vi.mocked(prisma.transportJourneyAdvice.findUnique).mockResolvedValue({
      id: "advice-1",
      tripId: "trip-1",
      preference: "balanced",
      status: "recommended",
      decision: "pending",
      evaluatedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      explanation: "ok",
      provenanceJson: {},
      requiresHumanReview: false,
      acceptedQuoteTotalCents: 12500,
      originKind: "synthetic",
      candidates: [],
    } as never);
    vi.mocked(prisma.transportJourneyAdvice.update).mockResolvedValue({
      id: "advice-1",
      tripId: "trip-1",
      preference: "balanced",
      status: "dismissed",
      decision: "dismissed",
      evaluatedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      explanation: "ok",
      provenanceJson: {},
      requiresHumanReview: false,
      acceptedQuoteTotalCents: 12500,
      originKind: "synthetic",
      candidates: [],
    } as never);

    const result = await recordJourneyAdviceDecision(
      participant,
      "trip-1",
      "advice-1",
      "dismissed"
    );
    expect(result.advisoryOnly).toBe(true);
    expect(result.bookingUnchanged).toBe(true);
    expect(result.quoteUnchanged).toBe(true);
    expect(result.status).toBe("dismissed");
    expect(prisma.transportTrip.update).not.toHaveBeenCalled();
    expect(prisma.transportQuote.update).not.toHaveBeenCalled();
    expect(recordTripEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "maji_dismissed" })
    );
  });

  it("returns 404 for an unauthorised user", async () => {
    vi.mocked(assertCanAccessTrip).mockRejectedValueOnce(
      new TransportApiError("TRANSPORT_TRIP_NOT_FOUND")
    );
    const { evaluateJourneyAdvice } = await import(
      "@/lib/transport/maji/journey-advice-service"
    );
    await expect(
      evaluateJourneyAdvice(participant, "trip-1", { preference: "balanced" })
    ).rejects.toMatchObject({ code: "TRANSPORT_TRIP_NOT_FOUND" });

    vi.mocked(requireApiSession).mockResolvedValue(participant as never);
    vi.mocked(assertCanAccessTrip).mockRejectedValueOnce(
      new TransportApiError("TRANSPORT_TRIP_NOT_FOUND")
    );
    const { POST } = await import(
      "@/app/api/transport/trips/[tripId]/route-advice/route"
    );
    const res = await POST(new Request("http://localhost/api", { method: "POST", body: "{}" }), {
      params: Promise.resolve({ tripId: "trip-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("marks advice advisory_expired when it is stale before review", async () => {
    const { recordJourneyAdviceDecision } = await import(
      "@/lib/transport/maji/journey-advice-service"
    );
    vi.mocked(prisma.transportJourneyAdvice.findUnique).mockResolvedValue({
      id: "advice-1",
      tripId: "trip-1",
      preference: "balanced",
      status: "recommended",
      decision: "pending",
      evaluatedAt: new Date("2026-06-01T09:00:00.000Z"),
      expiresAt: new Date("2026-06-01T09:01:00.000Z"),
      explanation: "ok",
      provenanceJson: {},
      requiresHumanReview: false,
      acceptedQuoteTotalCents: 12500,
      originKind: "synthetic",
      candidates: [],
    } as never);
    vi.mocked(prisma.transportJourneyAdvice.update).mockResolvedValue({
      id: "advice-1",
      tripId: "trip-1",
      preference: "balanced",
      status: "advisory_expired",
      decision: "pending",
      evaluatedAt: new Date("2026-06-01T09:00:00.000Z"),
      expiresAt: new Date("2026-06-01T09:01:00.000Z"),
      explanation: "ok",
      provenanceJson: {},
      requiresHumanReview: false,
      acceptedQuoteTotalCents: 12500,
      originKind: "synthetic",
      candidates: [],
    } as never);

    const result = await recordJourneyAdviceDecision(
      participant,
      "trip-1",
      "advice-1",
      "acknowledged"
    );
    expect(result.status).toBe("advisory_expired");
    expect(prisma.transportTrip.update).not.toHaveBeenCalled();
  });

  it("returns the same advice id for a duplicate unexpired evaluation", async () => {
    const existing = {
      id: "advice-dup",
      tripId: "trip-1",
      preference: "balanced",
      status: "recommended",
      decision: "pending",
      evaluatedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      explanation: "cached",
      provenanceJson: {},
      requiresHumanReview: false,
      acceptedQuoteTotalCents: 12500,
      originKind: "synthetic",
      candidates: [],
    };
    vi.mocked(prisma.transportJourneyAdvice.findUnique).mockResolvedValue(
      existing as never
    );
    const { evaluateJourneyAdvice } = await import(
      "@/lib/transport/maji/journey-advice-service"
    );
    const first = await evaluateJourneyAdvice(participant, "trip-1", {
      preference: "balanced",
    });
    const second = await evaluateJourneyAdvice(participant, "trip-1", {
      preference: "balanced",
    });
    expect(first.adviceId).toBe("advice-dup");
    expect(second.adviceId).toBe(first.adviceId);
    expect(prisma.transportJourneyAdvice.create).not.toHaveBeenCalled();
  });

  it("returns the accepted quote total without updating quote rows", async () => {
    const { evaluateJourneyAdvice } = await import(
      "@/lib/transport/maji/journey-advice-service"
    );
    await evaluateJourneyAdvice(participant, "trip-1", { preference: "balanced" });
    expect(getAcceptedQuoteTotalCentsForTripRequest).toHaveBeenCalledWith("req-1");
    expect(prisma.transportQuote.update).not.toHaveBeenCalled();
    expect(prisma.transportJourneyAdvice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          acceptedQuoteTotalCents: 12500,
          quoteUnchanged: true,
          bookingUnchanged: true,
          advisoryOnly: true,
        }),
      })
    );
  });
});

describe("Journey Intelligence panel accessibility", () => {
  it("exposes named 44px controls and a polite live region", () => {
    render(
      React.createElement(MajiJourneyIntelligencePanel, {
        tripId: "trip-1",
        enabled: true,
        mode: "participant",
      })
    );
    const compare = screen.getByRole("button", {
      name: "Compare remaining routes",
    });
    expect(compare.getAttribute("class") ?? "").toContain("min-h-11");
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
    expect(screen.getByLabelText("Lowest operating cost")).toBeTruthy();
    expect(screen.getByText(/does not change the booking/i)).toBeTruthy();
    expect(screen.queryByText(/NDIS covered/i)).toBeNull();
  });

  it("keeps driver mode read-only without dismiss or refer actions", () => {
    render(
      React.createElement(MajiJourneyIntelligencePanel, {
        tripId: "trip-1",
        enabled: true,
        mode: "driver",
      })
    );
    expect(screen.queryByRole("button", { name: "Dismiss comparison" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Request operator review" })
    ).toBeNull();
    expect(screen.getByText(/read-only while driving/i)).toBeTruthy();
  });
});
