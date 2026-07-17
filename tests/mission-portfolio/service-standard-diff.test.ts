import { describe, expect, it } from "vitest";

import {
  buildServiceChangeDiff,
  renderServiceChangeDiffText,
} from "@/lib/mission-portfolio/service-diff";
import {
  hardRequirements,
  ParticipantServiceStandardSchema,
  selectShareableFields,
} from "@/lib/mission-portfolio/service-standard";

describe("participant service standard", () => {
  const standard = ParticipantServiceStandardSchema.parse({
    id: "std-1",
    participantId: "participant-1",
    organisationId: "org-1",
    version: 1,
    status: "active",
    diagnosisInferred: false,
    providerAuthoredSubstitute: false,
    participantApprovedAt: "2026-07-17T10:00:00.000Z",
    createdAt: "2026-07-17T09:00:00.000Z",
    updatedAt: "2026-07-17T10:00:00.000Z",
    fields: [
      {
        key: "preferred_name",
        value: "Taylor",
        requirementLevel: "hard_requirement",
        shareWith: ["worker", "provider"],
        source: "participant",
        consentBasis: "explicit_disclosure",
        effectiveFrom: "2026-07-17T09:00:00.000Z",
        effectiveTo: null,
      },
      {
        key: "sensory_preferences",
        value: "Quiet arrival preferred",
        requirementLevel: "preference",
        shareWith: ["worker"],
        source: "participant",
        consentBasis: "explicit_disclosure",
        effectiveFrom: "2026-07-17T09:00:00.000Z",
        effectiveTo: null,
      },
      {
        key: "feedback_method",
        value: "Email only",
        requirementLevel: "preference",
        shareWith: ["none"],
        source: "participant",
        consentBasis: "explicit_disclosure",
        effectiveFrom: "2026-07-17T09:00:00.000Z",
        effectiveTo: null,
      },
    ],
  });

  it("exposes hard requirements separately from preferences", () => {
    expect(hardRequirements(standard)).toEqual(["preferred_name"]);
  });

  it("applies field-level sharing", () => {
    const worker = selectShareableFields(standard, "worker");
    expect(worker.map((f) => f.key).sort()).toEqual(
      ["preferred_name", "sensory_preferences"].sort(),
    );
    const provider = selectShareableFields(standard, "provider");
    expect(provider.map((f) => f.key)).toEqual(["preferred_name"]);
  });
});

describe("service change diff", () => {
  it("is deterministic and flags missing/unknown fields", () => {
    const prior = {
      fields: {
        worker: "Alex",
        provider: "Harbour Care",
        vehicle: "Van A",
        driver: "Sam",
        venue: "Harbour Civic",
        entrance: "West",
        route: "Door-to-room known",
        support_time: "09:00",
        agreement: "v1",
        price: "120",
        equipment: "Powered wheelchair",
        communication_acknowledgement: "passport_v2",
        funding_route: "plan_managed",
      },
    };
    const proposed = {
      fields: {
        worker: "Jordan",
        provider: "Harbour Care",
        vehicle: null,
        driver: "Sam",
        venue: "Harbour Civic",
        entrance: "unknown",
        route: "Door-to-room known",
        support_time: "09:30",
        agreement: "v1",
        price: "120",
        equipment: "Powered wheelchair",
        communication_acknowledgement: "passport_v2",
        funding_route: "plan_managed",
      },
    };

    const a = buildServiceChangeDiff(prior, proposed);
    const b = buildServiceChangeDiff(prior, proposed);
    expect(a).toEqual(b);
    expect(a.authoritativeConclusions).toBe(false);
    expect(a.changed.map((c) => c.field).sort()).toEqual(
      ["entrance", "support_time", "vehicle", "worker"].sort(),
    );
    expect(a.newlyMissing).toContain("vehicle");
    expect(a.newUnknowns).toContain("entrance");
    expect(a.participantActionRequired).toBe(true);
    expect(a.impact.timing).toBe("changed");
    expect(a.impact.access).toBe("unknown");

    const text = renderServiceChangeDiffText(a);
    expect(text).toContain("What changed");
    expect(text).toContain("worker: Alex → Jordan");
    expect(text).toContain("Authoritative conclusions: none");
  });
});
