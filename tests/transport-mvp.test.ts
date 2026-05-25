import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { buildAccessNeedsSummary } from "@/lib/transport-mvp/access-needs-summary";
import {
  getStopsForViewer,
  redactStopAddress,
  resolveAddressViewerRole,
} from "@/lib/transport-mvp/address-privacy";
import {
  isDriverEligible,
  isVehicleEligible,
} from "@/lib/transport-mvp/dispatch-service";
import { createTransportTripRequestSchema } from "@/lib/validation/transport-mvp";

describe("transport mvp permissions", () => {
  it("allows participant transport self manage", () => {
    expect(hasPermission("participant", "transport:manage:self")).toBe(true);
  });

  it("allows provider admin org transport manage", () => {
    expect(hasPermission("provider_admin", "transport:manage:org")).toBe(true);
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
  it("withholds detail without consent for provider viewer", () => {
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

describe("transport mvp zod schemas", () => {
  it("validates the required booking fields", () => {
    const parsed = createTransportTripRequestSchema.parse({
      pickupAddress: "1 Main St",
      dropoffAddress: "2 Main St",
      pickupWindowStart: new Date().toISOString(),
      wheelchairRequired: true,
    });
    expect(parsed.wheelchairRequired).toBe(true);
  });

  it("rejects invalid passenger counts", () => {
    const result = createTransportTripRequestSchema.safeParse({
      pickupAddress: "1 Main St",
      dropoffAddress: "2 Main St",
      pickupWindowStart: new Date().toISOString(),
      passengerCount: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("trip evidence guard", () => {
  it("can be checked when a test database is configured", async () => {
    if (process.env.TRANSPORT_MVP_DB_TESTS !== "true") {
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
