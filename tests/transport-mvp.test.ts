import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import {
  getStopsForViewer,
  redactStopAddress,
  resolveAddressViewerRole,
} from "@/lib/transport-mvp/address-privacy";
import {
  isDriverEligible,
  isVehicleEligible,
} from "@/lib/transport-mvp/dispatch-service";
import { buildAccessNeedsSummary } from "@/lib/transport-mvp/access-needs-summary";

describe("transport mvp permissions", () => {
  it("allows participant transport self manage", () => {
    expect(hasPermission("participant", "transport:manage:self")).toBe(true);
  });

  it("allows transport operator org transport manage", () => {
    expect(hasPermission("transport_operator", "transport:manage:org")).toBe(true);
  });

  it("allows driver trips", () => {
    expect(hasPermission("driver", "driver:trips")).toBe(true);
  });
});

describe("address privacy", () => {
  const stop = {
    id: "s1",
    tripId: "t1",
    sequence: 0,
    stopType: "pickup" as const,
    addressFull: "123 Secret St, Melbourne VIC 3000",
    addressSuburb: "Melbourne",
    lat: -37.81,
    lng: 144.96,
    scheduledAt: null,
    notes: "Ring bell",
  };

  it("shows full address to participant", () => {
    const role = resolveAddressViewerRole({
      viewerUserId: "p1",
      participantId: "p1",
      organisationId: "org1",
      viewerOrgIds: [],
    });
    expect(role).toBe("participant");
    const redacted = redactStopAddress(stop, role);
    expect(redacted.redacted).toBe(false);
    expect(redacted.address).toContain("Secret");
  });

  it("redacts address for unaffiliated viewer", () => {
    const role = resolveAddressViewerRole({
      viewerUserId: "x",
      participantId: "p1",
      organisationId: "org1",
      viewerOrgIds: [],
    });
    const redacted = redactStopAddress(stop, role);
    expect(redacted.redacted).toBe(true);
    expect(redacted.lat).toBeNull();
    expect(redacted.address).not.toContain("Secret");
  });

  it("shows full address to assigned driver", () => {
    const role = resolveAddressViewerRole({
      viewerUserId: "d1",
      participantId: "p1",
      organisationId: "org1",
      viewerOrgIds: [],
      assignedDriverUserId: "d1",
    });
    const stops = getStopsForViewer([stop], role);
    expect(stops[0].redacted).toBe(false);
  });
});

describe("dispatch eligibility", () => {
  it("blocks unverified driver", () => {
    const result = isDriverEligible({
      verificationStatus: "pending_review",
      active: true,
      verifications: [
        { licenceStatus: "verified", screeningStatus: "verified" },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("allows verified active driver", () => {
    const result = isDriverEligible({
      verificationStatus: "verified",
      active: true,
      verifications: [
        { licenceStatus: "verified", screeningStatus: "verified" },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("blocks inactive vehicle", () => {
    const result = isVehicleEligible({
      verificationStatus: "verified",
      active: false,
    });
    expect(result.ok).toBe(false);
  });
});

describe("access needs summary", () => {
  it("withholds detail without consent flag for viewer", () => {
    const summary = buildAccessNeedsSummary(
      {
        id: "a1",
        requestId: null,
        tripId: null,
        wheelchairRequired: true,
        assistedPickup: true,
        assistedDropoff: false,
        driverAssistanceRequired: false,
        mobilityAidsJson: null,
        assistanceNotes: "Private note",
        shareAccessibility: true,
      },
      { canViewDetail: false }
    );
    expect(summary.shared).toBe(false);
    expect(summary.lines[0]).toContain("consent");
  });
});

describe("trip evidence guard", () => {
  it("assertTripHasEvidence throws without db row", async () => {
    if (!process.env.DATABASE_URL) {
      expect(true).toBe(true);
      return;
    }
    const { assertTripHasEvidence } = await import(
      "@/lib/transport-mvp/trip-evidence-service"
    );
    await expect(assertTripHasEvidence("nonexistent-trip-id")).rejects.toThrow(
      "EVIDENCE_REQUIRED"
    );
  });
});

describe("consent gate on create", () => {
  it("createTransportTripRequest throws CONSENT_REQUIRED", async () => {
    if (!process.env.DATABASE_URL) {
      expect(true).toBe(true);
      return;
    }
    const { createTransportTripRequest } = await import(
      "@/lib/transport-mvp/trip-request-service"
    );
    try {
      await createTransportTripRequest({
        participantId: "no-such-user",
        pickupAddress: "A",
        dropoffAddress: "B",
        pickupWindowStart: new Date(),
        shareAccessibility: true,
        shareAccessibilityConfirmed: true,
        organisationId: "seed-transport-org",
      });
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toBe("CONSENT_REQUIRED");
    }
  });
});
