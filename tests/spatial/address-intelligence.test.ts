import { describe, expect, it } from "vitest";

import {
  buildAddressResolutionResult,
  confirmAddressResolution,
  isConfirmedAddressResolution,
} from "@/lib/spatial/address-intelligence";
import { createGeoscapeSourceReference } from "@/lib/spatial/provenance";
import type { SpatialCandidate } from "@/lib/spatial/types";
import type { GeoscapeResolvedAddress } from "@/types/geoscape-predictive";

const resolved: GeoscapeResolvedAddress = {
  id: "suggest-1",
  gnafId: "GANSW123",
  formattedAddress: "1 DEMO STREET, SYDNEY NSW 2000",
  suburb: "SYDNEY",
  state: "NSW",
  postcode: "2000",
  lat: -33.8,
  lng: 151.2,
};

describe("Access Address Intelligence", () => {
  it("builds a resolution that always requires confirmation", () => {
    const result = buildAddressResolutionResult({ resolved });
    expect(result.requiresConfirmation).toBe(true);
    expect(result.confirmationStatus).toBe("inferred");
    expect(result.addressId).toBe("GANSW123");
    expect(result.sourceReference.product).toBe("predictive");
    expect(result.sourceReference.attribution).toMatch(/Geoscape/i);
    expect(result.limitations.some((l) => /not the same as an accessible/i.test(l))).toBe(
      true,
    );
    expect(isConfirmedAddressResolution(result)).toBe(false);
  });

  it("marks ambiguity when multiple building candidates exist", () => {
    const source = createGeoscapeSourceReference({
      product: "buildings",
      endpoint: "/buildings",
      dataset: "stub",
    });
    const buildings: SpatialCandidate[] = [
      {
        candidateId: "b1",
        type: "building",
        label: "Building A",
        source,
        confidence: "low",
        evidence: ["synthetic stub"],
        status: "inferred",
      },
      {
        candidateId: "b2",
        type: "building",
        label: "Building B",
        source,
        confidence: "low",
        evidence: ["synthetic stub"],
        status: "inferred",
      },
    ];
    const result = buildAddressResolutionResult({
      resolved,
      buildingCandidates: buildings,
    });
    expect(result.ambiguity.isAmbiguous).toBe(true);
    expect(result.ambiguity.candidateCount).toBe(2);
    expect(result.buildingCandidates.every((c) => c.status === "inferred")).toBe(true);
  });

  it("participant confirmation clears requiresConfirmation without access claims", () => {
    const inferred = buildAddressResolutionResult({ resolved });
    const confirmed = confirmAddressResolution(inferred, {
      status: "participant_confirmed",
    });
    expect(confirmed.requiresConfirmation).toBe(false);
    expect(confirmed.confirmationStatus).toBe("participant_confirmed");
    expect(isConfirmedAddressResolution(confirmed)).toBe(true);
    expect(confirmed.limitations.some((l) => /compliance/i.test(l))).toBe(true);
  });

  it("rejection does not confirm the address", () => {
    const inferred = buildAddressResolutionResult({ resolved });
    const rejected = confirmAddressResolution(inferred, { status: "rejected" });
    expect(rejected.confirmationStatus).toBe("rejected");
    expect(isConfirmedAddressResolution(rejected)).toBe(false);
  });
});
