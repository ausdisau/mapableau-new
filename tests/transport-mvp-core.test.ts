import { describe, expect, it } from "vitest";

import {
  AV_BILLING_HOLD_STATUSES,
  avTripTransitionAllowed,
} from "@/lib/av-framework/trip-transitions";
import { buildSandboxQuotes, fundingLabelForDeclared } from "@/lib/transport/transport-quote-adapter";
import { presentQuoteAmounts } from "@/lib/transport/transport-pricing-service";
import {
  coarsenCoordinates,
  encryptTransportPayload,
  decryptTransportPayload,
} from "@/lib/transport/transport-location-crypto";
import { transportAccessProfileUpdateSchema } from "@/lib/validation/transport-access-profile-schemas";

describe("transport MVP core", () => {
  it("allows quote lifecycle transitions", () => {
    expect(avTripTransitionAllowed("requested", "quote_available")).toBe(true);
    expect(avTripTransitionAllowed("quote_available", "participant_confirmed")).toBe(
      true
    );
    expect(avTripTransitionAllowed("participant_confirmed", "dispatch_pending")).toBe(
      true
    );
    expect(avTripTransitionAllowed("settled", "requested")).toBe(false);
  });

  it("marks dispute and incident statuses as billing hold", () => {
    expect(AV_BILLING_HOLD_STATUSES).toContain("disputed");
    expect(AV_BILLING_HOLD_STATUSES).toContain("incident_hold");
  });

  it("builds sandbox quotes ranked by access fit and excludes fails", () => {
    const quotes = buildSandboxQuotes({
      mobilityRequirements: { requiresWheelchairAccessible: true, requiresRamp: true },
      operatorOrganisationId: "org_1",
    });
    expect(quotes.every((q) => q.sandbox && q.advisory)).toBe(true);
    expect(quotes.every((q) => q.accessFit !== "fail")).toBe(true);
    expect(quotes.some((q) => q.id === "sandbox-wav")).toBe(true);
  });

  it("never claims NDIS covered from plan type alone", () => {
    expect(fundingLabelForDeclared("ndia_managed")).toBe(
      "Funding eligibility not verified"
    );
    expect(fundingLabelForDeclared("private_pay")).toBe("Private pay");
  });

  it("encrypts and decrypts location payloads", () => {
    const enc = encryptTransportPayload({ address: "1 Test St", lat: -33.8, lng: 151.2 });
    const serialized = JSON.stringify(enc);
    const roundTrip = decryptTransportPayload(JSON.parse(serialized));
    expect(roundTrip).toEqual({ address: "1 Test St", lat: -33.8, lng: 151.2 });
    const coarse = coarsenCoordinates(-33.8688, 151.2093);
    expect(coarse.lat).toBeCloseTo(-33.87, 2);
  });

  it("validates access profile updates without diagnosis fields", () => {
    const parsed = transportAccessProfileUpdateSchema.parse({
      serviceAnimal: true,
      mobilityDevices: [{ type: "power_wheelchair", level: "required" }],
      safePickupNotes: "Use rear entrance",
    });
    expect(parsed.serviceAnimal).toBe(true);
    expect("diagnosis" in parsed).toBe(false);
  });

  it("presents quote amounts with honest funding label", () => {
    const amounts = presentQuoteAmounts(
      { participantPaidCents: 4300, potentiallyClaimableCents: 0 },
      4300
    );
    expect(amounts.fundingLabel).toBe("Funding eligibility not verified");
    expect(amounts.currency).toBe("AUD");
  });
});
