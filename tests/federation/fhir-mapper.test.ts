import { describe, expect, it } from "vitest";

import { toFhirConsent } from "@/lib/interoperability/fhir/consent-mapper";
import {
  refuseFhirOutbound,
  simulatorEmit,
} from "@/lib/interoperability/fhir/fhir-adapter-shell";

const directive = {
  id: "d1",
  version: 1,
  subjectId: "p1",
  authorId: "p1",
  recipientCategory: "support_coordinator",
  recipientOrganisationId: null,
  recipientEntityId: null,
  purpose: "care_coordination",
  purposeDetail: "share access preferences with new coordinator",
  scopeKeys: ["accessibilityPreferences"],
  frequency: "ongoing_until_revoked",
  decision: "active",
  status: "active",
  effectiveFrom: new Date("2026-07-17T00:00:00Z"),
  effectiveUntil: null,
  supersedesId: null,
  proofBundle: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as const;

describe("FHIR consent mapper", () => {
  it("emits active status for active/active directives", () => {
    const fhir = toFhirConsent(directive as never);
    expect(fhir.status).toBe("active");
    expect(fhir.resourceType).toBe("Consent");
  });

  it("emits inactive when decision is withdrawn", () => {
    const fhir = toFhirConsent({
      ...directive,
      decision: "withdrawn",
      status: "withdrawn",
    } as never);
    expect(fhir.status).toBe("inactive");
  });

  it("uses pairwise system for the patient identifier", () => {
    const fhir = toFhirConsent(directive as never);
    expect(fhir.patient.identifier.system).toContain("pairwise");
    expect(fhir.patient.identifier.value.startsWith("pairwise:")).toBe(true);
  });

  it("permits when active, denies otherwise", () => {
    expect(toFhirConsent(directive as never).provision?.type).toBe("permit");
    expect(
      toFhirConsent({ ...directive, decision: "denied" } as never).provision?.type
    ).toBe("deny");
  });
});

describe("FHIR adapter refusal", () => {
  it("refuses outbound when env flag is off", () => {
    const previous = process.env.FEDERATION_FHIR_OUTBOUND_ENABLED;
    delete process.env.FEDERATION_FHIR_OUTBOUND_ENABLED;
    expect(() =>
      refuseFhirOutbound({
        endpoint: "https://fhir.example",
        resource: {},
        purposeSummary: "test",
      })
    ).toThrow(/fhir_outbound_disabled/);
    if (previous !== undefined)
      process.env.FEDERATION_FHIR_OUTBOUND_ENABLED = previous;
  });

  it("still refuses when flag is on but no runbook ref is supplied", () => {
    const previous = process.env.FEDERATION_FHIR_OUTBOUND_ENABLED;
    process.env.FEDERATION_FHIR_OUTBOUND_ENABLED = "true";
    expect(() =>
      refuseFhirOutbound({
        endpoint: "https://fhir.example",
        resource: {},
        purposeSummary: "test",
      })
    ).toThrow(/runbook_ref_required/);
    if (previous !== undefined)
      process.env.FEDERATION_FHIR_OUTBOUND_ENABLED = previous;
    else delete process.env.FEDERATION_FHIR_OUTBOUND_ENABLED;
  });

  it("simulator emit produces a safe simulator ref", async () => {
    const result = await simulatorEmit({
      endpoint: "https://fhir.example",
      resource: {},
      purposeSummary: "test",
    });
    expect(result.simulator).toBe(true);
    expect(result.artifactRef.startsWith("simulator://")).toBe(true);
  });
});
