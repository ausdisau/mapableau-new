import { describe, expect, it } from "vitest";

import {
  EVIDENCE_PROVENANCE_LABELS,
  EVIDENCE_PROVENANCE_VALUES,
  buildAssertionProvenance,
  evidenceProvenanceSchema,
  gaisStateToEvidenceProvenance,
  sourceClassToEvidenceProvenance,
  storageStatusToEvidenceProvenance,
} from "@mapable/contracts";

describe("canonical evidence provenance taxonomy", () => {
  it("defines all six portfolio provenance values", () => {
    expect(EVIDENCE_PROVENANCE_VALUES).toEqual([
      "verified",
      "authoritative",
      "community_confirmed",
      "inferred",
      "stale",
      "unknown",
    ]);
    for (const value of EVIDENCE_PROVENANCE_VALUES) {
      expect(evidenceProvenanceSchema.parse(value)).toBe(value);
      expect(EVIDENCE_PROVENANCE_LABELS[value].length).toBeGreaterThan(0);
    }
  });

  it("maps storage statuses to canonical provenance", () => {
    expect(storageStatusToEvidenceProvenance("verified")).toBe("verified");
    expect(storageStatusToEvidenceProvenance("community_reported")).toBe(
      "community_confirmed",
    );
    expect(storageStatusToEvidenceProvenance("outdated")).toBe("stale");
    expect(
      storageStatusToEvidenceProvenance("observed", { freshnessExpired: true }),
    ).toBe("stale");
    expect(storageStatusToEvidenceProvenance("unknown")).toBe("unknown");
  });

  it("maps source classes without auto-verifying AI", () => {
    expect(sourceClassToEvidenceProvenance("ai_inferred")).toBe("inferred");
    expect(sourceClassToEvidenceProvenance("independently_verified")).toBe(
      "verified",
    );
    expect(sourceClassToEvidenceProvenance("expired")).toBe("stale");
    expect(sourceClassToEvidenceProvenance("unknown")).toBe("unknown");
  });

  it("maps GAIS states to canonical provenance", () => {
    expect(gaisStateToEvidenceProvenance("VERIFIED")).toBe("verified");
    expect(gaisStateToEvidenceProvenance("AI_INFERRED")).toBe("inferred");
    expect(gaisStateToEvidenceProvenance("UNKNOWN")).toBe("unknown");
  });

  it("serialises assertion provenance with required metadata fields", () => {
    const assertion = buildAssertionProvenance({
      provenance: "inferred",
      source: "model_candidate",
      timestamp: "2026-08-12T00:00:00.000Z",
      evidenceType: "physical.step_free",
      confidence: 0.42,
      expiryAt: "2026-08-13T00:00:00.000Z",
    });

    expect(assertion.verificationState).toBe("inferred");
    expect(assertion.routingUncertainty).toBe(true);
    expect(assertion.displayLabel).toMatch(/unverified/i);
    expect(assertion.expiryAt).toBe("2026-08-13T00:00:00.000Z");
  });
});
